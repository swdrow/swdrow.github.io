#!/bin/bash

# Nextcloud Service Management Script
# This script provides comprehensive management tools for Nextcloud services
# including migration support, health checks, and troubleshooting utilities.

set -euo pipefail

# Configuration
SCRIPT_NAME="nextcloud-management"
LOG_FILE="/var/log/nextcloud-management.log"
CONFIG_FILE="/etc/nextcloud-management.conf"

# Default values
NEXTCLOUD_DATA_DIR="/storage/nextcloud_data"
NEXTCLOUD_MOUNT_POINT="/var/snap/nextcloud/common/storage_data"
BACKUP_DIR="/backup"
ZFS_POOL="storage"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') [$SCRIPT_NAME] $1" | tee -a "$LOG_FILE"
}

# Error function
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

# Load configuration if it exists
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        info "Configuration loaded from $CONFIG_FILE"
    fi
}

# Service management functions
start_services() {
    info "Starting Nextcloud services..."
    
    systemctl start snap.nextcloud.redis-server
    sleep 2
    systemctl start snap.nextcloud.php-fpm
    sleep 2
    systemctl start snap.nextcloud.apache
    sleep 3
    
    if check_services_status; then
        success "All Nextcloud services started successfully"
    else
        error "Some services failed to start"
        return 1
    fi
}

stop_services() {
    info "Stopping Nextcloud services..."
    
    systemctl stop snap.nextcloud.apache
    systemctl stop snap.nextcloud.php-fpm
    systemctl stop snap.nextcloud.redis-server
    
    # Wait for services to stop completely
    sleep 5
    
    if ! check_services_status; then
        success "All Nextcloud services stopped successfully"
    else
        warning "Some services may still be running"
    fi
}

restart_services() {
    info "Restarting Nextcloud services..."
    stop_services
    sleep 5
    start_services
}

check_services_status() {
    local all_running=true
    
    info "Checking Nextcloud service status..."
    
    services=("snap.nextcloud.apache" "snap.nextcloud.php-fpm" "snap.nextcloud.redis-server")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            success "$service is running"
        else
            error "$service is not running"
            all_running=false
        fi
    done
    
    return $all_running
}

# Health check functions
health_check() {
    info "Performing comprehensive health check..."
    
    local issues=0
    
    # Check ZFS pool health
    if ! zpool status "$ZFS_POOL" | grep -q "state: ONLINE"; then
        error "ZFS pool $ZFS_POOL is not online"
        ((issues++))
    else
        success "ZFS pool $ZFS_POOL is healthy"
    fi
    
    # Check mount points
    if mount | grep -q "$NEXTCLOUD_MOUNT_POINT"; then
        success "Nextcloud data mount point is active"
    else
        error "Nextcloud data mount point is not active"
        ((issues++))
    fi
    
    # Check data directory permissions
    if [[ -d "$NEXTCLOUD_DATA_DIR" ]]; then
        local owner=$(stat -c '%U' "$NEXTCLOUD_DATA_DIR")
        if [[ "$owner" == "root" ]]; then
            success "Data directory ownership is correct"
        else
            warning "Data directory owner is $owner (expected: root)"
        fi
    else
        error "Data directory $NEXTCLOUD_DATA_DIR does not exist"
        ((issues++))
    fi
    
    # Check web interface
    if curl -s -I http://localhost/nextcloud/ | grep -q "200 OK"; then
        success "Web interface is accessible"
    else
        error "Web interface is not accessible"
        ((issues++))
    fi
    
    # Check disk space
    local usage=$(df "$NEXTCLOUD_DATA_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $usage -gt 90 ]]; then
        error "Disk usage is critical: ${usage}%"
        ((issues++))
    elif [[ $usage -gt 80 ]]; then
        warning "Disk usage is high: ${usage}%"
    else
        success "Disk usage is normal: ${usage}%"
    fi
    
    if [[ $issues -eq 0 ]]; then
        success "Health check passed - no issues found"
        return 0
    else
        error "Health check found $issues issue(s)"
        return 1
    fi
}

# Migration functions
setup_migration() {
    info "Setting up Nextcloud data migration..."
    
    # Create new data directory if it doesn't exist
    if [[ ! -d "$NEXTCLOUD_DATA_DIR" ]]; then
        mkdir -p "$NEXTCLOUD_DATA_DIR"
        success "Created data directory: $NEXTCLOUD_DATA_DIR"
    fi
    
    # Create mount point directory
    if [[ ! -d "$NEXTCLOUD_MOUNT_POINT" ]]; then
        mkdir -p "$NEXTCLOUD_MOUNT_POINT"
        success "Created mount point: $NEXTCLOUD_MOUNT_POINT"
    fi
    
    # Set proper permissions
    chown -R root:root "$NEXTCLOUD_DATA_DIR"
    chmod 755 "$NEXTCLOUD_DATA_DIR"
    
    success "Migration setup completed"
}

perform_migration() {
    local source_dir="${1:-/var/snap/nextcloud/common/nextcloud/data}"
    
    info "Performing Nextcloud data migration..."
    info "Source: $source_dir"
    info "Destination: $NEXTCLOUD_DATA_DIR"
    
    # Pre-migration checks
    if [[ ! -d "$source_dir" ]]; then
        error "Source directory $source_dir does not exist"
        return 1
    fi
    
    if ! zpool status "$ZFS_POOL" | grep -q "state: ONLINE"; then
        error "ZFS pool is not healthy - aborting migration"
        return 1
    fi
    
    # Stop services
    stop_services
    
    # Create backup snapshot
    local snapshot_name="before_migration_$(date +%Y%m%d_%H%M%S)"
    if zfs snapshot "$ZFS_POOL/nextcloud_data@$snapshot_name" 2>/dev/null; then
        success "Created backup snapshot: $snapshot_name"
    else
        warning "Could not create backup snapshot"
    fi
    
    # Perform migration
    info "Starting data migration (this may take a long time)..."
    if rsync -avH --progress "$source_dir/" "$NEXTCLOUD_DATA_DIR/"; then
        success "Data migration completed successfully"
    else
        error "Data migration failed"
        return 1
    fi
    
    # Set up bind mount
    setup_bind_mount
    
    # Update Nextcloud configuration
    update_nextcloud_config
    
    # Start services
    start_services
    
    # Verify migration
    verify_migration
    
    success "Migration process completed"
}

setup_bind_mount() {
    info "Setting up bind mount..."
    
    # Unmount if already mounted
    if mount | grep -q "$NEXTCLOUD_MOUNT_POINT"; then
        umount "$NEXTCLOUD_MOUNT_POINT"
    fi
    
    # Create bind mount
    if mount --bind "$NEXTCLOUD_DATA_DIR" "$NEXTCLOUD_MOUNT_POINT"; then
        success "Bind mount created successfully"
    else
        error "Failed to create bind mount"
        return 1
    fi
    
    # Add to fstab if not already present
    if ! grep -q "$NEXTCLOUD_MOUNT_POINT" /etc/fstab; then
        echo "$NEXTCLOUD_DATA_DIR $NEXTCLOUD_MOUNT_POINT none bind 0 0" >> /etc/fstab
        success "Added bind mount to /etc/fstab"
    fi
}

update_nextcloud_config() {
    info "Updating Nextcloud configuration..."
    
    # Update data directory setting
    if nextcloud.occ config:system:set datadirectory --value="$NEXTCLOUD_MOUNT_POINT"; then
        success "Updated Nextcloud data directory configuration"
    else
        error "Failed to update Nextcloud configuration"
        return 1
    fi
    
    # Verify configuration
    local configured_dir=$(nextcloud.occ config:system:get datadirectory)
    if [[ "$configured_dir" == "$NEXTCLOUD_MOUNT_POINT" ]]; then
        success "Configuration verified: $configured_dir"
    else
        error "Configuration verification failed: $configured_dir"
        return 1
    fi
}

verify_migration() {
    info "Verifying migration..."
    
    # Check file access
    if nextcloud.occ files:scan --all --quiet; then
        success "File scan completed successfully"
    else
        warning "File scan completed with warnings"
    fi
    
    # Check integrity
    if nextcloud.occ integrity:check-core --quiet; then
        success "Core integrity check passed"
    else
        warning "Core integrity check found issues"
    fi
    
    # Test web access
    if curl -s -I http://localhost/nextcloud/ | grep -q "200 OK"; then
        success "Web interface is accessible after migration"
    else
        error "Web interface is not accessible after migration"
        return 1
    fi
}

# Backup and restore functions
create_backup() {
    local backup_name="nextcloud-backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    info "Creating backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Stop services for consistent backup
    stop_services
    
    # Backup data
    info "Backing up data directory..."
    rsync -avH "$NEXTCLOUD_DATA_DIR/" "$backup_path/data/"
    
    # Backup configuration
    info "Backing up configuration..."
    cp -r /var/snap/nextcloud/current/ "$backup_path/config/"
    
    # Export database
    info "Backing up database..."
    nextcloud.export "$backup_path/database.sql"
    
    # Start services
    start_services
    
    success "Backup created: $backup_path"
}

restore_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup $backup_name not found"
        return 1
    fi
    
    info "Restoring from backup: $backup_name"
    
    # Stop services
    stop_services
    
    # Restore data
    info "Restoring data..."
    rsync -avH --delete "$backup_path/data/" "$NEXTCLOUD_DATA_DIR/"
    
    # Restore configuration
    info "Restoring configuration..."
    cp -r "$backup_path/config/" /var/snap/nextcloud/current/
    
    # Import database
    info "Restoring database..."
    nextcloud.import "$backup_path/database.sql"
    
    # Fix permissions
    chown -R root:root "$NEXTCLOUD_DATA_DIR"
    
    # Start services
    start_services
    
    success "Restore completed from: $backup_name"
}

# Maintenance functions
run_maintenance() {
    info "Running Nextcloud maintenance tasks..."
    
    # Enable maintenance mode
    nextcloud.occ maintenance:mode --on
    
    # Update database indices
    nextcloud.occ db:add-missing-indices
    
    # Convert to big int if needed
    nextcloud.occ db:convert-filecache-bigint
    
    # Clean up
    nextcloud.occ files:cleanup
    
    # Disable maintenance mode
    nextcloud.occ maintenance:mode --off
    
    success "Maintenance tasks completed"
}

fix_permissions() {
    info "Fixing Nextcloud permissions..."
    
    chown -R root:root "$NEXTCLOUD_DATA_DIR"
    find "$NEXTCLOUD_DATA_DIR" -type d -exec chmod 755 {} \;
    find "$NEXTCLOUD_DATA_DIR" -type f -exec chmod 644 {} \;
    
    success "Permissions fixed"
}

# Monitoring functions
enable_monitoring() {
    info "Setting up Nextcloud monitoring..."
    
    cat > /usr/local/bin/nextcloud-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/nextcloud-monitor.log"
DATE=$(date)

# Check service status
for service in snap.nextcloud.apache snap.nextcloud.php-fpm snap.nextcloud.redis-server; do
    if systemctl is-active --quiet "$service"; then
        echo "$DATE: $service is running" >> "$LOG_FILE"
    else
        echo "$DATE: WARNING - $service is not running" >> "$LOG_FILE"
    fi
done

# Check mount point
if mount | grep -q storage_data; then
    echo "$DATE: Mount point active" >> "$LOG_FILE"
else
    echo "$DATE: WARNING - Mount point not active" >> "$LOG_FILE"
fi

# Check disk usage
USAGE=$(df /storage | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 90 ]; then
    echo "$DATE: CRITICAL - Disk usage: $USAGE%" >> "$LOG_FILE"
elif [ "$USAGE" -gt 80 ]; then
    echo "$DATE: WARNING - Disk usage: $USAGE%" >> "$LOG_FILE"
fi

# Check web access
if curl -s -I http://localhost/nextcloud/ | grep -q "200 OK"; then
    echo "$DATE: Web interface accessible" >> "$LOG_FILE"
else
    echo "$DATE: WARNING - Web interface not accessible" >> "$LOG_FILE"
fi
EOF

    chmod +x /usr/local/bin/nextcloud-monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/nextcloud-monitor.sh") | crontab -
    
    success "Monitoring enabled (runs every 5 minutes)"
}

# Usage information
usage() {
    echo "Nextcloud Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Service Management:"
    echo "  start                 Start all Nextcloud services"
    echo "  stop                  Stop all Nextcloud services"
    echo "  restart               Restart all Nextcloud services"
    echo "  status                Check service status"
    echo ""
    echo "Health & Diagnostics:"
    echo "  health                Perform comprehensive health check"
    echo "  fix-permissions       Fix data directory permissions"
    echo "  maintenance           Run maintenance tasks"
    echo ""
    echo "Migration:"
    echo "  setup-migration       Set up migration environment"
    echo "  migrate [source_dir]  Perform data migration"
    echo "  setup-mount           Set up bind mount"
    echo "  verify-migration      Verify migration was successful"
    echo ""
    echo "Backup & Restore:"
    echo "  backup                Create full backup"
    echo "  restore <backup_name> Restore from backup"
    echo "  list-backups          List available backups"
    echo ""
    echo "Monitoring:"
    echo "  enable-monitoring     Set up automated monitoring"
    echo "  monitor-status        Show current monitoring status"
    echo ""
    echo "Examples:"
    echo "  $0 health"
    echo "  $0 migrate /var/snap/nextcloud/common/nextcloud/data"
    echo "  $0 backup"
    echo "  $0 restore nextcloud-backup-20240101-120000"
}

# Main script logic
main() {
    local command="${1:-}"
    
    if [[ -z "$command" ]]; then
        usage
        exit 1
    fi
    
    check_root
    load_config
    
    case "$command" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_services_status
            ;;
        health)
            health_check
            ;;
        setup-migration)
            setup_migration
            ;;
        migrate)
            perform_migration "${2:-}"
            ;;
        setup-mount)
            setup_bind_mount
            ;;
        verify-migration)
            verify_migration
            ;;
        backup)
            create_backup
            ;;
        restore)
            if [[ -z "${2:-}" ]]; then
                error "Backup name required for restore"
                exit 1
            fi
            restore_backup "$2"
            ;;
        list-backups)
            ls -la "$BACKUP_DIR"/nextcloud-backup-*
            ;;
        maintenance)
            run_maintenance
            ;;
        fix-permissions)
            fix_permissions
            ;;
        enable-monitoring)
            enable_monitoring
            ;;
        monitor-status)
            tail -20 /var/log/nextcloud-monitor.log
            ;;
        -h|--help)
            usage
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"