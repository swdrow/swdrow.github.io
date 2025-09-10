# Nextcloud Migration Troubleshooting Guide

This guide provides comprehensive procedures for troubleshooting Nextcloud data directory migrations, with a focus on resolving common issues that arise during the migration process.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Process](#migration-process)
3. [Post-Migration Troubleshooting](#post-migration-troubleshooting)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Recovery Procedures](#recovery-procedures)

## Pre-Migration Checklist

### Before Starting Migration

```bash
# 1. Create a full backup of Nextcloud data and configuration
sudo rsync -avH /var/snap/nextcloud/common/ /backup/nextcloud-backup-$(date +%Y%m%d)/

# 2. Export the database
sudo nextcloud.export

# 3. Document current configuration
sudo nextcloud.occ config:list > /backup/nextcloud-config-$(date +%Y%m%d).json

# 4. Check available space on destination
df -h /storage/

# 5. Verify destination permissions
ls -la /storage/
```

### System Requirements Check

```bash
# Check Nextcloud service status
sudo systemctl status snap.nextcloud.*

# Check disk I/O performance
sudo hdparm -tT /dev/sda
sudo hdparm -tT /storage/

# Verify ZFS pool health (if applicable)
sudo zpool status

# Check system resources
free -h
df -h
```

## Migration Process

### Step-by-Step Migration

#### 1. Stop Nextcloud Services
```bash
# Stop all Nextcloud services
sudo systemctl stop snap.nextcloud.apache
sudo systemctl stop snap.nextcloud.php-fpm
sudo systemctl stop snap.nextcloud.redis-server

# Verify services are stopped
sudo systemctl status snap.nextcloud.*
```

#### 2. Create New Data Directory
```bash
# Create the new directory structure
sudo mkdir -p /storage/nextcloud_data
sudo mkdir -p /var/snap/nextcloud/common/storage_data

# Set proper ownership
sudo chown -R root:root /storage/nextcloud_data
sudo chmod 755 /storage/nextcloud_data
```

#### 3. Migrate Data
```bash
# Start the migration with progress monitoring
sudo rsync -avH --progress /var/snap/nextcloud/common/nextcloud/data/ /storage/nextcloud_data/

# Verify the transfer
sudo diff -r /var/snap/nextcloud/common/nextcloud/data/ /storage/nextcloud_data/
```

#### 4. Create Bind Mount
```bash
# Create the bind mount
sudo mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data

# Make it permanent in /etc/fstab
echo "/storage/nextcloud_data /var/snap/nextcloud/common/storage_data none bind 0 0" | sudo tee -a /etc/fstab

# Verify mount
mount | grep nextcloud
```

#### 5. Update Configuration
```bash
# Update Nextcloud configuration
sudo nextcloud.occ config:system:set datadirectory --value="/var/snap/nextcloud/common/storage_data"

# Verify configuration
sudo nextcloud.occ config:system:get datadirectory
```

#### 6. Restart Services
```bash
# Start Nextcloud services
sudo systemctl start snap.nextcloud.apache
sudo systemctl start snap.nextcloud.php-fpm
sudo systemctl start snap.nextcloud.redis-server

# Check service status
sudo systemctl status snap.nextcloud.*
```

## Post-Migration Troubleshooting

### Verification Steps

```bash
# 1. Test Nextcloud access
curl -I http://localhost/nextcloud/

# 2. Check file access
sudo nextcloud.occ files:scan --all

# 3. Verify user data integrity
sudo nextcloud.occ integrity:check-core
sudo nextcloud.occ integrity:check-app files

# 4. Check log files
sudo tail -f /var/snap/nextcloud/current/logs/nextcloud.log
```

### Performance Verification

```bash
# Check I/O performance on new location
sudo dd if=/dev/zero of=/storage/nextcloud_data/test_file bs=1M count=1000
sudo rm /storage/nextcloud_data/test_file

# Monitor system resources during operation
iostat -x 1
htop
```

## Common Issues and Solutions

### Issue 1: Permission Denied Errors

**Symptoms:**
- Web interface shows errors accessing files
- Log shows permission denied messages

**Solution:**
```bash
# Fix ownership recursively
sudo chown -R www-data:www-data /storage/nextcloud_data/

# Fix permissions
sudo find /storage/nextcloud_data/ -type d -exec chmod 755 {} \;
sudo find /storage/nextcloud_data/ -type f -exec chmod 644 {} \;

# For snap installations, use root:root
sudo chown -R root:root /storage/nextcloud_data/
```

### Issue 2: Bind Mount Not Working

**Symptoms:**
- Old data still being accessed
- New directory appears empty in Nextcloud

**Solution:**
```bash
# Check if mount is active
mount | grep storage_data

# Remount if necessary
sudo umount /var/snap/nextcloud/common/storage_data
sudo mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data

# Verify mount point
ls -la /var/snap/nextcloud/common/storage_data/
```

### Issue 3: Database Path Issues

**Symptoms:**
- Nextcloud reports missing files
- User data appears empty

**Solution:**
```bash
# Update file paths in database
sudo nextcloud.occ files:scan --all
sudo nextcloud.occ files:cleanup

# Manually update paths if needed
sudo nextcloud.occ config:system:set datadirectory --value="/var/snap/nextcloud/common/storage_data"
```

### Issue 4: Service Startup Failures

**Symptoms:**
- Nextcloud services fail to start
- Web interface not accessible

**Solution:**
```bash
# Check service logs
sudo journalctl -u snap.nextcloud.apache -f
sudo journalctl -u snap.nextcloud.php-fpm -f

# Check Nextcloud logs
sudo tail -f /var/snap/nextcloud/current/logs/nextcloud.log

# Reset services if needed
sudo systemctl reset-failed snap.nextcloud.*
sudo systemctl restart snap.nextcloud.*
```

### Issue 5: Incomplete Data Transfer

**Symptoms:**
- Some files missing after migration
- Inconsistent user data

**Solution:**
```bash
# Verify transfer completeness
sudo rsync -avc --dry-run /var/snap/nextcloud/common/nextcloud/data/ /storage/nextcloud_data/

# Re-sync missing files
sudo rsync -avH /var/snap/nextcloud/common/nextcloud/data/ /storage/nextcloud_data/

# Force file rescan
sudo nextcloud.occ files:scan --all --verbose
```

## Recovery Procedures

### Rollback to Original Configuration

If migration fails and you need to rollback:

```bash
# 1. Stop Nextcloud services
sudo systemctl stop snap.nextcloud.*

# 2. Remove bind mount
sudo umount /var/snap/nextcloud/common/storage_data
sudo sed -i '/storage_data/d' /etc/fstab

# 3. Restore original configuration
sudo nextcloud.occ config:system:set datadirectory --value="/var/snap/nextcloud/common/nextcloud/data"

# 4. Start services
sudo systemctl start snap.nextcloud.*

# 5. Verify functionality
curl -I http://localhost/nextcloud/
```

### Emergency Data Recovery

If data appears corrupted or missing:

```bash
# 1. Stop services immediately
sudo systemctl stop snap.nextcloud.*

# 2. Restore from backup
sudo rsync -avH /backup/nextcloud-backup-YYYYMMDD/ /var/snap/nextcloud/common/

# 3. Import database backup
sudo nextcloud.import /backup/nextcloud-backup-YYYYMMDD/database.sql

# 4. Reset permissions
sudo chown -R root:root /var/snap/nextcloud/common/nextcloud/

# 5. Start services
sudo systemctl start snap.nextcloud.*
```

### Partial Recovery

If only some data is affected:

```bash
# 1. Identify affected users/files
sudo nextcloud.occ files:scan --verbose

# 2. Restore specific user data
sudo rsync -avH /backup/nextcloud-backup-YYYYMMDD/nextcloud/data/username/ /storage/nextcloud_data/username/

# 3. Fix ownership
sudo chown -R root:root /storage/nextcloud_data/username/

# 4. Rescan user files
sudo nextcloud.occ files:scan username
```

## Monitoring and Maintenance

### Post-Migration Monitoring

```bash
# Create monitoring script
cat > /usr/local/bin/nextcloud-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/nextcloud-migration-monitor.log"
DATE=$(date)

# Check service status
systemctl is-active snap.nextcloud.apache >> "$LOG_FILE"

# Check mount point
if mount | grep -q storage_data; then
    echo "$DATE: Mount point active" >> "$LOG_FILE"
else
    echo "$DATE: WARNING - Mount point not active" >> "$LOG_FILE"
fi

# Check disk space
USAGE=$(df /storage | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 90 ]; then
    echo "$DATE: WARNING - Disk usage high: $USAGE%" >> "$LOG_FILE"
fi
EOF

chmod +x /usr/local/bin/nextcloud-monitor.sh

# Add to crontab for regular monitoring
echo "*/15 * * * * /usr/local/bin/nextcloud-monitor.sh" | sudo crontab -
```

### Backup Verification

```bash
# Regular backup verification script
cat > /usr/local/bin/verify-nextcloud-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backup/nextcloud-backup-$(date +%Y%m%d)"
DATA_DIR="/storage/nextcloud_data"

echo "Verifying backup integrity..."

# Check if backup exists and is recent
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_AGE=$(find "$BACKUP_DIR" -mtime +1 | wc -l)
    if [ "$BACKUP_AGE" -gt 0 ]; then
        echo "WARNING: Backup is older than 24 hours"
    else
        echo "Backup is current"
    fi
else
    echo "ERROR: No recent backup found"
fi

# Verify critical files exist in backup
CRITICAL_FILES=("config.php" "data/index.html")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/nextcloud/$file" ]; then
        echo "✓ $file found in backup"
    else
        echo "✗ $file missing from backup"
    fi
done
EOF

chmod +x /usr/local/bin/verify-nextcloud-backup.sh
```

## Best Practices

### Migration Best Practices

1. **Always backup before migration**
2. **Test migration process in development environment first**
3. **Plan for adequate downtime**
4. **Monitor disk space during migration**
5. **Verify data integrity after migration**
6. **Document all changes made**

### Security Considerations

```bash
# Secure the new data directory
sudo chmod 750 /storage/nextcloud_data
sudo chown root:www-data /storage/nextcloud_data

# Remove world-readable permissions
sudo find /storage/nextcloud_data -type f -exec chmod 640 {} \;
sudo find /storage/nextcloud_data -type d -exec chmod 750 {} \;
```

### Performance Optimization

```bash
# Optimize for new storage location
sudo nextcloud.occ config:system:set memcache.local --value="\\OC\\Memcache\\Redis"
sudo nextcloud.occ config:system:set filelocking.enabled --value=true

# Update PHP settings for larger storage
sudo sed -i 's/memory_limit = .*/memory_limit = 512M/' /var/snap/nextcloud/current/php/php.ini
sudo sed -i 's/upload_max_filesize = .*/upload_max_filesize = 10G/' /var/snap/nextcloud/current/php/php.ini
```

---

**Important Notes:**
- Always test procedures in a development environment first
- Maintain current backups throughout the migration process
- Monitor system resources and performance after migration
- Document any custom configurations or modifications
- Keep detailed logs of all migration steps for troubleshooting