#!/bin/bash

# ZFS Pool Diagnostic Script
# This script performs comprehensive diagnostics on ZFS pools and provides
# actionable recommendations for resolving issues.

set -euo pipefail

# Configuration
POOL_NAME="${1:-storage}"  # Default pool name, can be overridden
LOG_FILE="/tmp/zfs-diagnostic-$(date +%Y%m%d-%H%M%S).log"
SMART_LOG="/tmp/smart-diagnostic-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# Error handling
error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

# Warning function
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Success function
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Info function
info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if ZFS is installed and loaded
check_zfs() {
    info "Checking ZFS installation and module status..."
    
    if ! command -v zpool &> /dev/null; then
        error "ZFS utilities not found. Please install ZFS."
        exit 1
    fi
    
    if ! lsmod | grep -q zfs; then
        warning "ZFS module not loaded. Attempting to load..."
        modprobe zfs || {
            error "Failed to load ZFS module"
            exit 1
        }
    fi
    
    success "ZFS is installed and module is loaded"
}

# Get pool status
check_pool_status() {
    info "Checking pool status for: $POOL_NAME"
    
    if ! zpool list "$POOL_NAME" &>/dev/null; then
        error "Pool '$POOL_NAME' not found or not imported"
        info "Available pools for import:"
        zpool import 2>/dev/null || echo "No pools available for import"
        return 1
    fi
    
    local pool_state=$(zpool status "$POOL_NAME" | grep "state:" | awk '{print $2}')
    
    case "$pool_state" in
        "ONLINE")
            success "Pool state: ONLINE"
            return 0
            ;;
        "DEGRADED")
            warning "Pool state: DEGRADED - Some devices may have failed"
            return 1
            ;;
        "FAULTED")
            error "Pool state: FAULTED - Pool has experienced a fatal error"
            return 2
            ;;
        "OFFLINE")
            error "Pool state: OFFLINE - Pool has been taken offline"
            return 2
            ;;
        "UNAVAIL")
            error "Pool state: UNAVAILABLE - Pool cannot be opened"
            return 2
            ;;
        "SUSPENDED")
            error "Pool state: SUSPENDED - Pool is suspended due to I/O errors"
            return 3
            ;;
        *)
            error "Pool state: UNKNOWN ($pool_state)"
            return 2
            ;;
    esac
}

# Check device health
check_device_health() {
    info "Checking device health for pool: $POOL_NAME"
    
    # Get list of devices in the pool
    local devices=$(zpool status "$POOL_NAME" | grep -E "/dev/|/by-id/" | awk '{print $1}' | sort -u)
    
    if [[ -z "$devices" ]]; then
        warning "No devices found in pool or pool status unavailable"
        return 1
    fi
    
    local failed_devices=0
    
    while IFS= read -r device; do
        if [[ -n "$device" && "$device" != "NAME" ]]; then
            info "Checking device: $device"
            
            # Check if device exists
            if [[ ! -b "$device" ]]; then
                error "Device $device does not exist or is not a block device"
                ((failed_devices++))
                continue
            fi
            
            # Check SMART status if available
            if command -v smartctl &> /dev/null; then
                if smartctl -H "$device" &>/dev/null; then
                    local smart_status=$(smartctl -H "$device" | grep "SMART overall-health" | awk '{print $NF}')
                    if [[ "$smart_status" == "PASSED" ]]; then
                        success "SMART health for $device: PASSED"
                    else
                        error "SMART health for $device: $smart_status"
                        ((failed_devices++))
                    fi
                else
                    warning "SMART not available for $device"
                fi
            else
                warning "smartctl not available for SMART health checks"
            fi
        fi
    done <<< "$devices"
    
    if [[ $failed_devices -eq 0 ]]; then
        success "All devices appear healthy"
        return 0
    else
        error "$failed_devices device(s) have issues"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    info "Checking system resources..."
    
    # Check memory
    local mem_available=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
    if (( $(echo "$mem_available < 1.0" | bc -l) )); then
        warning "Low available memory: ${mem_available}GB"
    else
        success "Available memory: ${mem_available}GB"
    fi
    
    # Check disk space
    local root_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [[ $root_usage -gt 90 ]]; then
        error "Root filesystem usage critical: ${root_usage}%"
    elif [[ $root_usage -gt 80 ]]; then
        warning "Root filesystem usage high: ${root_usage}%"
    else
        success "Root filesystem usage: ${root_usage}%"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk '{print $(NF-2)}' | sed 's/,//')
    local cpu_count=$(nproc)
    if (( $(echo "$load_avg > $cpu_count * 2" | bc -l) )); then
        warning "High system load: $load_avg (CPUs: $cpu_count)"
    else
        success "System load: $load_avg (CPUs: $cpu_count)"
    fi
}

# Check ZFS events
check_zfs_events() {
    info "Checking recent ZFS events..."
    
    local error_events=$(zpool events -H | grep -i error | wc -l)
    local fault_events=$(zpool events -H | grep -i fault | wc -l)
    
    if [[ $error_events -gt 0 ]]; then
        error "Found $error_events error events in ZFS log"
        info "Recent error events:"
        zpool events | grep -i error | tail -5 | tee -a "$LOG_FILE"
    fi
    
    if [[ $fault_events -gt 0 ]]; then
        error "Found $fault_events fault events in ZFS log"
        info "Recent fault events:"
        zpool events | grep -i fault | tail -5 | tee -a "$LOG_FILE"
    fi
    
    if [[ $error_events -eq 0 && $fault_events -eq 0 ]]; then
        success "No recent error or fault events found"
    fi
}

# Generate detailed SMART report
generate_smart_report() {
    if ! command -v smartctl &> /dev/null; then
        warning "smartctl not available - skipping detailed SMART report"
        return
    fi
    
    info "Generating detailed SMART report..."
    
    echo "=== SMART Health Report - $(date) ===" > "$SMART_LOG"
    
    # Get all block devices
    local devices=$(lsblk -dno NAME | grep -E "^sd|^nvme" | sed 's/^/\/dev\//')
    
    while IFS= read -r device; do
        if [[ -n "$device" ]]; then
            echo "=== Device: $device ===" >> "$SMART_LOG"
            smartctl -a "$device" >> "$SMART_LOG" 2>&1
            echo "" >> "$SMART_LOG"
        fi
    done <<< "$devices"
    
    success "SMART report saved to: $SMART_LOG"
}

# Provide recovery recommendations
provide_recommendations() {
    local pool_status_code=$1
    
    info "Generating recovery recommendations..."
    
    case $pool_status_code in
        0)
            success "Pool appears healthy. Consider regular maintenance:"
            echo "  - Schedule regular scrubs: zpool scrub $POOL_NAME"
            echo "  - Monitor SMART health weekly"
            echo "  - Ensure regular backups are in place"
            ;;
        1)
            warning "Pool is degraded. Immediate actions needed:"
            echo "  1. Identify failed devices: zpool status -v $POOL_NAME"
            echo "  2. Replace failed devices immediately"
            echo "  3. Clear errors after replacement: zpool clear $POOL_NAME"
            echo "  4. Run scrub to verify integrity: zpool scrub $POOL_NAME"
            ;;
        2)
            error "Pool is in critical state. Emergency actions:"
            echo "  1. Do NOT attempt to import/export the pool"
            echo "  2. Check all device connections and power"
            echo "  3. Run hardware diagnostics on all drives"
            echo "  4. Consider professional data recovery if needed"
            echo "  5. Restore from backup if available"
            ;;
        3)
            error "Pool is SUSPENDED. Recovery procedure:"
            echo "  1. Clear pool errors: zpool clear $POOL_NAME"
            echo "  2. If that fails, try: zpool import -F $POOL_NAME"
            echo "  3. Check device health and replace failed drives"
            echo "  4. Run immediate scrub: zpool scrub $POOL_NAME"
            echo "  5. Monitor closely for recurring issues"
            ;;
    esac
}

# Main execution
main() {
    echo "=== ZFS Pool Diagnostic Script ==="
    echo "Starting diagnostics for pool: $POOL_NAME"
    echo "Log file: $LOG_FILE"
    echo "=========================================="
    
    check_root
    check_zfs
    
    local pool_status_code
    check_pool_status
    pool_status_code=$?
    
    check_device_health
    check_system_resources
    check_zfs_events
    generate_smart_report
    
    echo "=========================================="
    provide_recommendations $pool_status_code
    echo "=========================================="
    
    info "Diagnostic complete. Detailed logs saved to:"
    info "  Main log: $LOG_FILE"
    info "  SMART log: $SMART_LOG"
    
    # Save pool status to log
    echo "=== Pool Status Output ===" >> "$LOG_FILE"
    zpool status -v "$POOL_NAME" >> "$LOG_FILE" 2>&1
    
    echo "=== Pool Events ===" >> "$LOG_FILE"
    zpool events >> "$LOG_FILE" 2>&1
    
    echo "=== System Information ===" >> "$LOG_FILE"
    uname -a >> "$LOG_FILE"
    free -h >> "$LOG_FILE"
    df -h >> "$LOG_FILE"
    lsblk >> "$LOG_FILE"
}

# Script usage
usage() {
    echo "Usage: $0 [pool_name]"
    echo "  pool_name: Name of the ZFS pool to diagnose (default: storage)"
    echo ""
    echo "Example:"
    echo "  $0 storage"
    echo "  $0 tank"
    exit 1
}

# Handle command line arguments
if [[ $# -gt 1 ]]; then
    usage
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
fi

# Run main function
main "$@"