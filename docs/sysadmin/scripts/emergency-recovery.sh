#!/bin/bash

# Quick Start Recovery Script for Nextcloud/ZFS Issues
# This script provides immediate troubleshooting for the suspended ZFS pool issue

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POOL_NAME="storage"
LOG_FILE="/tmp/emergency-recovery-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Emergency system state documentation
document_state() {
    info "Documenting current system state..."
    
    {
        echo "=== EMERGENCY RECOVERY LOG - $(date) ==="
        echo ""
        echo "System uptime:"
        uptime
        echo ""
        echo "ZFS Pool Status:"
        zpool status 2>&1
        echo ""
        echo "Disk usage:"
        df -h
        echo ""
        echo "Memory usage:"
        free -h
        echo ""
        echo "Service status:"
        systemctl status snap.nextcloud.* 2>&1 || true
        echo ""
        echo "Mount points:"
        mount | grep -E "(storage|nextcloud)" || true
        echo ""
        echo "Recent errors:"
        journalctl --since "1 hour ago" --priority=err --no-pager | tail -20 || true
        echo ""
        echo "=== END INITIAL STATE ==="
    } >> "$LOG_FILE"
    
    success "System state documented in $LOG_FILE"
}

# Quick ZFS pool assessment
assess_pool() {
    info "Assessing ZFS pool status..."
    
    if ! command -v zpool &> /dev/null; then
        error "ZFS utilities not found. Please install ZFS."
        exit 1
    fi
    
    if ! zpool list "$POOL_NAME" &>/dev/null; then
        error "Pool '$POOL_NAME' not found or not imported"
        info "Available pools for import:"
        zpool import 2>/dev/null || echo "No pools available for import"
        return 1
    fi
    
    local pool_state=$(zpool status "$POOL_NAME" | grep "state:" | awk '{print $2}')
    
    case "$pool_state" in
        "ONLINE")
            success "Pool state: ONLINE - Pool is healthy"
            return 0
            ;;
        "DEGRADED")
            warning "Pool state: DEGRADED - Some devices may have failed"
            return 1
            ;;
        "SUSPENDED")
            error "Pool state: SUSPENDED - This is the current issue"
            return 2
            ;;
        "FAULTED"|"OFFLINE"|"UNAVAIL")
            error "Pool state: $pool_state - Pool has critical issues"
            return 3
            ;;
        *)
            error "Pool state: UNKNOWN ($pool_state)"
            return 3
            ;;
    esac
}

# Attempt to recover suspended pool
recover_suspended_pool() {
    info "Attempting to recover suspended ZFS pool..."
    
    # Step 1: Try to clear errors
    info "Step 1: Clearing pool errors..."
    if zpool clear "$POOL_NAME" 2>>"$LOG_FILE"; then
        success "Pool clear command succeeded"
        
        # Check if pool is now online
        sleep 5
        local new_state=$(zpool status "$POOL_NAME" | grep "state:" | awk '{print $2}')
        if [[ "$new_state" == "ONLINE" ]]; then
            success "Pool is now ONLINE!"
            
            # Start immediate scrub
            info "Starting pool scrub to verify integrity..."
            zpool scrub "$POOL_NAME"
            success "Scrub started. Monitor with: sudo zpool status $POOL_NAME"
            return 0
        else
            warning "Pool clear succeeded but pool state is: $new_state"
        fi
    else
        warning "Pool clear command failed"
    fi
    
    # Step 2: Try force import
    info "Step 2: Attempting force import..."
    warning "This operation has some risk - proceeding with caution"
    
    # Export first if possible
    zpool export "$POOL_NAME" 2>/dev/null || true
    
    if zpool import -F "$POOL_NAME" 2>>"$LOG_FILE"; then
        success "Force import succeeded"
        
        local new_state=$(zpool status "$POOL_NAME" | grep "state:" | awk '{print $2}')
        info "Pool state after force import: $new_state"
        
        if [[ "$new_state" == "ONLINE" || "$new_state" == "DEGRADED" ]]; then
            success "Pool is accessible!"
            
            # Start scrub
            info "Starting pool scrub..."
            zpool scrub "$POOL_NAME"
            return 0
        fi
    else
        error "Force import failed"
    fi
    
    # Step 3: Check for device issues
    info "Step 3: Checking device health..."
    check_device_health
    
    return 1
}

# Check device health
check_device_health() {
    info "Checking device health..."
    
    if ! command -v smartctl &> /dev/null; then
        warning "smartctl not available - install smartmontools for device health checks"
        return 1
    fi
    
    # Get devices from pool status
    local devices=$(zpool status "$POOL_NAME" 2>/dev/null | grep -E "/dev/" | awk '{print $1}' | sort -u)
    
    if [[ -z "$devices" ]]; then
        warning "No devices found in pool listing"
        return 1
    fi
    
    local failed_devices=0
    
    while IFS= read -r device; do
        if [[ -n "$device" && -b "$device" ]]; then
            info "Checking device: $device"
            
            if smartctl -H "$device" 2>/dev/null | grep -q "PASSED"; then
                success "SMART health for $device: PASSED"
            else
                error "SMART health issue detected for $device"
                smartctl -H "$device" 2>&1 | tee -a "$LOG_FILE"
                ((failed_devices++))
            fi
        fi
    done <<< "$devices"
    
    if [[ $failed_devices -gt 0 ]]; then
        error "$failed_devices device(s) have SMART failures"
        warning "Consider replacing failed devices before adding new drives"
        return 1
    else
        success "All devices report healthy SMART status"
        return 0
    fi
}

# Restore Nextcloud services
restore_nextcloud() {
    info "Restoring Nextcloud services..."
    
    # Check if ZFS pool is accessible
    if ! zpool status "$POOL_NAME" | grep -q -E "state: (ONLINE|DEGRADED)"; then
        error "ZFS pool is not accessible - cannot restore Nextcloud safely"
        return 1
    fi
    
    # Check mount points
    info "Checking mount points..."
    if ! mount | grep -q "storage_data"; then
        warning "Nextcloud mount point missing - attempting to restore"
        if mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data; then
            success "Mount point restored"
        else
            error "Failed to restore mount point"
            return 1
        fi
    else
        success "Mount point is active"
    fi
    
    # Start services
    info "Starting Nextcloud services..."
    
    systemctl start snap.nextcloud.redis-server
    sleep 2
    systemctl start snap.nextcloud.php-fpm
    sleep 2
    systemctl start snap.nextcloud.apache
    sleep 3
    
    # Check service status
    local all_running=true
    for service in snap.nextcloud.apache snap.nextcloud.php-fpm snap.nextcloud.redis-server; do
        if systemctl is-active --quiet "$service"; then
            success "$service is running"
        else
            error "$service failed to start"
            all_running=false
        fi
    done
    
    # Test web interface
    if curl -s -I http://localhost/nextcloud/ | grep -q "200 OK"; then
        success "Nextcloud web interface is accessible"
    else
        warning "Nextcloud web interface may not be fully functional"
        all_running=false
    fi
    
    return $all_running
}

# Provide recovery summary and next steps
provide_summary() {
    local pool_status=$1
    local nextcloud_status=$2
    
    echo ""
    echo "======================================"
    echo "         RECOVERY SUMMARY"
    echo "======================================"
    
    if [[ $pool_status -eq 0 ]]; then
        success "ZFS Pool: Recovered and healthy"
        
        if [[ $nextcloud_status -eq 0 ]]; then
            success "Nextcloud: Services restored and functional"
            echo ""
            info "✅ RECOVERY SUCCESSFUL!"
            echo ""
            echo "Next steps:"
            echo "1. Monitor the pool scrub: sudo zpool status $POOL_NAME"
            echo "2. Wait for scrub to complete before adding the 2TB drive"
            echo "3. Once scrub is clean, add drive with: sudo zpool add $POOL_NAME /mnt/cloud_drive"
            echo "4. Monitor pool expansion: sudo zpool list $POOL_NAME"
            echo ""
            echo "Test Nextcloud access: http://localhost/nextcloud/"
        else
            warning "ZFS Pool: Recovered, but Nextcloud has issues"
            echo ""
            echo "Manual Nextcloud troubleshooting needed:"
            echo "1. Check logs: sudo journalctl -u snap.nextcloud.apache -f"
            echo "2. Check config: sudo nextcloud.occ config:system:get datadirectory"
            echo "3. Run file scan: sudo nextcloud.occ files:scan --all"
        fi
        
    else
        error "ZFS Pool: Recovery failed or incomplete"
        echo ""
        echo "⚠️  MANUAL INTERVENTION REQUIRED"
        echo ""
        echo "The ZFS pool could not be automatically recovered."
        echo "Recommended actions:"
        echo "1. Review the detailed log: $LOG_FILE"
        echo "2. Check device health with SMART tools"
        echo "3. Consider professional data recovery if critical"
        echo "4. Do NOT add the 2TB drive until pool is healthy"
        echo ""
        echo "For detailed troubleshooting, see:"
        echo "- docs/sysadmin/zfs-troubleshooting.md"
        echo "- docs/sysadmin/emergency-recovery.md"
    fi
    
    echo ""
    echo "Full recovery log saved to: $LOG_FILE"
    echo "======================================"
}

# Main recovery procedure
main() {
    echo "============================================"
    echo "  EMERGENCY NEXTCLOUD/ZFS RECOVERY SCRIPT"
    echo "============================================"
    echo ""
    
    check_root
    document_state
    
    echo ""
    info "Starting emergency recovery procedure..."
    
    # Step 1: Assess current pool state
    assess_pool
    local pool_assessment=$?
    
    if [[ $pool_assessment -eq 0 ]]; then
        success "Pool is already healthy - proceeding to Nextcloud recovery"
        restore_nextcloud
        local nextcloud_status=$?
        provide_summary 0 $nextcloud_status
        return 0
    fi
    
    # Step 2: Attempt pool recovery
    if [[ $pool_assessment -eq 2 ]]; then
        warning "Pool is SUSPENDED - attempting recovery..."
        recover_suspended_pool
        local recovery_status=$?
        
        if [[ $recovery_status -eq 0 ]]; then
            success "Pool recovery successful!"
            
            # Step 3: Restore Nextcloud
            restore_nextcloud
            local nextcloud_status=$?
            provide_summary 0 $nextcloud_status
        else
            error "Pool recovery failed"
            provide_summary 1 1
        fi
    else
        error "Pool is in critical state (not just suspended)"
        provide_summary 1 1
    fi
}

# Script usage
usage() {
    echo "Emergency Nextcloud/ZFS Recovery Script"
    echo ""
    echo "This script attempts to recover a suspended ZFS pool and restore"
    echo "Nextcloud functionality automatically."
    echo ""
    echo "Usage: sudo $0"
    echo ""
    echo "The script will:"
    echo "1. Document current system state"
    echo "2. Assess ZFS pool condition"
    echo "3. Attempt pool recovery if suspended"
    echo "4. Restore Nextcloud services"
    echo "5. Provide next steps for adding the 2TB drive"
    echo ""
    echo "IMPORTANT: Do NOT add the 2TB drive until the pool is healthy!"
}

# Handle help requests
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

# Run main recovery procedure
main "$@"