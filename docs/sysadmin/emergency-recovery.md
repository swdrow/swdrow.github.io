# Emergency Recovery Procedures

This document provides critical emergency procedures for recovering from system failures, with a focus on ZFS pool failures and Nextcloud service disruptions.

## Table of Contents

1. [Immediate Response Procedures](#immediate-response-procedures)
2. [ZFS Pool Emergency Recovery](#zfs-pool-emergency-recovery)
3. [Nextcloud Service Recovery](#nextcloud-service-recovery)
4. [Data Recovery Procedures](#data-recovery-procedures)
5. [System Recovery Checklist](#system-recovery-checklist)

## Immediate Response Procedures

### Emergency Assessment (First 5 Minutes)

```bash
# 1. Check system status immediately
uptime
df -h
free -h

# 2. Check ZFS pool status
sudo zpool status

# 3. Check Nextcloud services
sudo systemctl status snap.nextcloud.*

# 4. Check system logs for errors
sudo journalctl --since "5 minutes ago" --priority=err

# 5. Document current state
sudo zpool status > /tmp/emergency-status-$(date +%Y%m%d-%H%M%S).log
```

### Critical Decision Tree

**If ZFS pool is SUSPENDED:**
- ⚠️ **DO NOT REBOOT** - This may make recovery impossible
- ⚠️ **DO NOT IMPORT/EXPORT** the pool
- ✅ Follow [ZFS Pool Emergency Recovery](#zfs-pool-emergency-recovery)

**If Nextcloud is down but pool is healthy:**
- ✅ Follow [Nextcloud Service Recovery](#nextcloud-service-recovery)

**If system is unresponsive:**
- ⚠️ **Document everything before any restart**
- ✅ Follow [System Recovery Checklist](#system-recovery-checklist)

## ZFS Pool Emergency Recovery

### For SUSPENDED Pool State

**Current Issue:** Pool showing suspended state due to device/IO errors

```bash
#!/bin/bash
# Emergency ZFS Pool Recovery Script

set -euo pipefail

POOL_NAME="storage"
LOG_FILE="/tmp/zfs-emergency-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') EMERGENCY: $1" | tee -a "$LOG_FILE"
}

log "Starting emergency ZFS pool recovery for $POOL_NAME"

# Step 1: Document current state
log "Documenting current pool state"
sudo zpool status -v "$POOL_NAME" >> "$LOG_FILE" 2>&1
sudo zpool events >> "$LOG_FILE" 2>&1

# Step 2: Check device health FIRST
log "Checking device health"
for device in $(zpool status "$POOL_NAME" | grep -E "/dev/" | awk '{print $1}'); do
    if [[ -b "$device" ]]; then
        log "Checking $device"
        sudo smartctl -H "$device" >> "$LOG_FILE" 2>&1
    else
        log "WARNING: Device $device not found"
    fi
done

# Step 3: Attempt to clear errors
log "Attempting to clear pool errors"
if sudo zpool clear "$POOL_NAME" 2>> "$LOG_FILE"; then
    log "Pool clear successful"
    
    # Check if pool is now online
    if zpool status "$POOL_NAME" | grep -q "state: ONLINE"; then
        log "SUCCESS: Pool is now online"
        log "Starting immediate scrub to verify integrity"
        sudo zpool scrub "$POOL_NAME"
    else
        log "Pool clear succeeded but pool still not online"
    fi
else
    log "Pool clear failed - attempting force import"
    
    # Step 4: Attempt force import (DANGEROUS - last resort)
    log "WARNING: Attempting force import - this may cause data loss"
    if sudo zpool import -F "$POOL_NAME" 2>> "$LOG_FILE"; then
        log "Force import successful"
    else
        log "CRITICAL: Force import failed - professional recovery may be needed"
    fi
fi

log "Emergency recovery attempt completed. Check pool status:"
sudo zpool status "$POOL_NAME" | tee -a "$LOG_FILE"
```

### Device Failure Recovery

```bash
# If specific devices have failed

# 1. Identify failed device
FAILED_DEVICE=$(zpool status storage | grep UNAVAIL | awk '{print $1}')

if [[ -n "$FAILED_DEVICE" ]]; then
    echo "Failed device identified: $FAILED_DEVICE"
    
    # 2. Check if we have a replacement device available
    # Note: /mnt/cloud_drive mentioned in problem statement
    REPLACEMENT_DEVICE="/mnt/cloud_drive"
    
    if [[ -e "$REPLACEMENT_DEVICE" ]]; then
        echo "Replacement device found: $REPLACEMENT_DEVICE"
        
        # 3. Replace the failed device
        sudo zpool replace storage "$FAILED_DEVICE" "$REPLACEMENT_DEVICE"
        
        # 4. Monitor replacement progress
        watch sudo zpool status storage
    else
        echo "No replacement device available. Pool will remain degraded."
    fi
fi
```

## Nextcloud Service Recovery

### Service Restart Procedure

```bash
#!/bin/bash
# Nextcloud Emergency Service Recovery

log_nc() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') NEXTCLOUD: $1"
}

log_nc "Starting Nextcloud emergency recovery"

# Step 1: Stop all services cleanly
log_nc "Stopping Nextcloud services"
sudo systemctl stop snap.nextcloud.apache
sudo systemctl stop snap.nextcloud.php-fpm  
sudo systemctl stop snap.nextcloud.redis-server

# Wait for services to stop completely
sleep 10

# Step 2: Check mount points
log_nc "Verifying mount points"
if ! mount | grep -q "storage_data"; then
    log_nc "WARNING: storage_data mount point missing - attempting to restore"
    sudo mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data
fi

# Step 3: Check data directory permissions
log_nc "Checking data directory permissions"
sudo chown -R root:root /storage/nextcloud_data
sudo chmod 755 /storage/nextcloud_data

# Step 4: Verify ZFS pool is accessible
log_nc "Verifying ZFS pool accessibility"
if ! zpool status storage | grep -q "state: ONLINE"; then
    log_nc "ERROR: ZFS pool not online - cannot start Nextcloud safely"
    exit 1
fi

# Step 5: Start services in order
log_nc "Starting Redis"
sudo systemctl start snap.nextcloud.redis-server
sleep 5

log_nc "Starting PHP-FPM"
sudo systemctl start snap.nextcloud.php-fpm
sleep 5

log_nc "Starting Apache"
sudo systemctl start snap.nextcloud.apache
sleep 5

# Step 6: Verify services are running
log_nc "Verifying service status"
sudo systemctl status snap.nextcloud.apache
sudo systemctl status snap.nextcloud.php-fpm
sudo systemctl status snap.nextcloud.redis-server

# Step 7: Test Nextcloud functionality
log_nc "Testing Nextcloud access"
if curl -I http://localhost/nextcloud/ 2>/dev/null | grep -q "200 OK"; then
    log_nc "SUCCESS: Nextcloud is accessible"
else
    log_nc "WARNING: Nextcloud may not be fully functional"
fi

log_nc "Nextcloud recovery procedure completed"
```

### Database Recovery

```bash
# If Nextcloud database issues are suspected

# 1. Stop Nextcloud services
sudo systemctl stop snap.nextcloud.*

# 2. Check database integrity
sudo nextcloud.mysql-client -e "CHECK TABLE oc_filecache;"

# 3. Repair database if needed
sudo nextcloud.mysql-client -e "REPAIR TABLE oc_filecache;"

# 4. Run Nextcloud maintenance
sudo nextcloud.occ maintenance:mode --on
sudo nextcloud.occ db:add-missing-indices
sudo nextcloud.occ db:convert-filecache-bigint
sudo nextcloud.occ maintenance:mode --off

# 5. Restart services
sudo systemctl start snap.nextcloud.*
```

## Data Recovery Procedures

### Backup Restoration

```bash
#!/bin/bash
# Emergency backup restoration

BACKUP_DATE="${1:-$(date +%Y%m%d)}"
BACKUP_DIR="/backup/nextcloud-backup-$BACKUP_DATE"
RESTORE_DIR="/storage/nextcloud_data"

echo "Starting emergency data restoration from $BACKUP_DIR"

# Step 1: Verify backup exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "ERROR: Backup directory $BACKUP_DIR not found"
    echo "Available backups:"
    ls -la /backup/nextcloud-backup-*
    exit 1
fi

# Step 2: Stop Nextcloud services
sudo systemctl stop snap.nextcloud.*

# Step 3: Create recovery snapshot of current state
sudo zfs snapshot storage/nextcloud_data@emergency_recovery_$(date +%Y%m%d_%H%M%S)

# Step 4: Restore data
echo "Restoring data from backup..."
sudo rsync -avH --delete "$BACKUP_DIR/nextcloud/data/" "$RESTORE_DIR/"

# Step 5: Restore database
echo "Restoring database..."
sudo nextcloud.import "$BACKUP_DIR/database.sql"

# Step 6: Fix permissions
sudo chown -R root:root "$RESTORE_DIR"

# Step 7: Start services
sudo systemctl start snap.nextcloud.*

echo "Emergency restoration completed"
```

### Partial Data Recovery

```bash
# Recover specific user data or files

USER_TO_RECOVER="username"
BACKUP_DIR="/backup/nextcloud-backup-$(date +%Y%m%d)"
RESTORE_TARGET="/storage/nextcloud_data/$USER_TO_RECOVER"

echo "Recovering data for user: $USER_TO_RECOVER"

# Create backup of current user data
sudo cp -r "$RESTORE_TARGET" "$RESTORE_TARGET.backup.$(date +%H%M%S)"

# Restore user data from backup
sudo rsync -avH "$BACKUP_DIR/nextcloud/data/$USER_TO_RECOVER/" "$RESTORE_TARGET/"

# Fix permissions
sudo chown -R root:root "$RESTORE_TARGET"

# Rescan user files
sudo nextcloud.occ files:scan "$USER_TO_RECOVER"

echo "User data recovery completed for $USER_TO_RECOVER"
```

## System Recovery Checklist

### Pre-Recovery Documentation

```bash
# ALWAYS run this before making any changes
cat > /tmp/emergency-system-state.txt << EOF
=== EMERGENCY SYSTEM STATE - $(date) ===

System uptime:
$(uptime)

ZFS Pool Status:
$(sudo zpool status 2>&1)

Disk usage:
$(df -h)

Memory usage:
$(free -h)

Service status:
$(sudo systemctl status snap.nextcloud.* 2>&1)

Mount points:
$(mount | grep -E "(storage|nextcloud)")

Recent errors:
$(sudo journalctl --since "1 hour ago" --priority=err --no-pager)

=== END EMERGENCY STATE ===
EOF

echo "Emergency state documented in /tmp/emergency-system-state.txt"
```

### Recovery Priority Order

1. **First Priority: Ensure data integrity**
   ```bash
   # Check ZFS pool health
   sudo zpool status
   
   # Create emergency snapshot if possible
   sudo zfs snapshot storage/nextcloud_data@emergency_$(date +%Y%m%d_%H%M%S)
   ```

2. **Second Priority: Restore storage access**
   ```bash
   # Run ZFS diagnostics
   ./docs/sysadmin/scripts/zfs-diagnostics.sh storage
   
   # Follow ZFS troubleshooting guide
   # Do not proceed until storage is stable
   ```

3. **Third Priority: Restore Nextcloud services**
   ```bash
   # Verify mount points
   mount | grep storage_data
   
   # Restart Nextcloud services
   sudo systemctl restart snap.nextcloud.*
   ```

4. **Fourth Priority: Verify functionality**
   ```bash
   # Test Nextcloud access
   curl -I http://localhost/nextcloud/
   
   # Run integrity checks
   sudo nextcloud.occ integrity:check-core
   ```

### Emergency Contact Information

```bash
# Create emergency contact script
cat > /usr/local/bin/emergency-alert.sh << 'EOF'
#!/bin/bash

EMERGENCY_TYPE="$1"
DETAILS="$2"
LOG_FILE="/var/log/emergency-alerts.log"

echo "$(date): EMERGENCY - $EMERGENCY_TYPE: $DETAILS" >> "$LOG_FILE"

# Send email alert (configure with your email settings)
# echo "$DETAILS" | mail -s "EMERGENCY: $EMERGENCY_TYPE" admin@example.com

# Log to syslog
logger -p daemon.crit "EMERGENCY: $EMERGENCY_TYPE - $DETAILS"

echo "Emergency alert logged: $EMERGENCY_TYPE"
EOF

chmod +x /usr/local/bin/emergency-alert.sh

# Usage: emergency-alert.sh "ZFS Pool Suspended" "Storage pool unavailable"
```

## Post-Recovery Procedures

### Verification Checklist

```bash
#!/bin/bash
# Post-recovery verification

echo "=== POST-RECOVERY VERIFICATION ==="

# 1. ZFS Pool Health
echo "1. Checking ZFS pool health..."
if zpool status storage | grep -q "state: ONLINE"; then
    echo "✓ ZFS pool is online"
else
    echo "✗ ZFS pool is not online"
fi

# 2. Nextcloud Services
echo "2. Checking Nextcloud services..."
if systemctl is-active --quiet snap.nextcloud.apache; then
    echo "✓ Nextcloud Apache is running"
else
    echo "✗ Nextcloud Apache is not running"
fi

# 3. Data Access
echo "3. Testing data access..."
if [[ -r "/storage/nextcloud_data/index.html" ]]; then
    echo "✓ Data directory is accessible"
else
    echo "✗ Data directory access issue"
fi

# 4. Web Interface
echo "4. Testing web interface..."
if curl -s -I http://localhost/nextcloud/ | grep -q "200 OK"; then
    echo "✓ Web interface is accessible"
else
    echo "✗ Web interface is not accessible"
fi

# 5. Mount Points
echo "5. Verifying mount points..."
if mount | grep -q "storage_data"; then
    echo "✓ Mount points are correct"
else
    echo "✗ Mount point issue detected"
fi

echo "=== VERIFICATION COMPLETE ==="
```

### Monitoring Setup

```bash
# Set up enhanced monitoring after recovery
cat > /usr/local/bin/post-recovery-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/post-recovery-monitor.log"

# Log pool status every 5 minutes
while true; do
    STATUS=$(zpool status storage | grep "state:" | awk '{print $2}')
    echo "$(date): Pool status: $STATUS" >> "$LOG_FILE"
    
    if [[ "$STATUS" != "ONLINE" ]]; then
        /usr/local/bin/emergency-alert.sh "Pool Status Change" "Pool is now $STATUS"
    fi
    
    sleep 300
done
EOF

chmod +x /usr/local/bin/post-recovery-monitor.sh

# Run as background daemon
nohup /usr/local/bin/post-recovery-monitor.sh &
```

---

**Emergency Contact Information:**
- System Administrator: [Add contact details]
- Backup Administrator: [Add contact details]
- Professional Recovery Service: [Add contact details]

**Critical Files Locations:**
- Emergency logs: `/tmp/emergency-*.log`
- System state backup: `/tmp/emergency-system-state.txt`
- Recovery scripts: `/usr/local/bin/`

**Remember:** Always prioritize data integrity over service availability. It's better to have services down with data intact than services running with corrupted data.