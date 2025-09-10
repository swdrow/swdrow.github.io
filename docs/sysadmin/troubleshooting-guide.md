# Nextcloud ZFS Troubleshooting Manual

This manual provides step-by-step procedures for resolving the specific issues mentioned in your case: ZFS pool suspension and Nextcloud data migration problems.

## Current Situation Analysis

Based on your description:
- ✅ Nextcloud data successfully migrated from `/var/snap/nextcloud/common/nextcloud/data/` to `/storage/nextcloud_data/`
- ✅ Bind mount created and working
- ✅ Configuration updated and permissions set
- ❌ ZFS pool showing suspended state due to device/IO errors
- ❌ Need to add 2TB drive (`/mnt/cloud_drive/`) to the pool
- ❌ Nextcloud instance is down due to ZFS pool issues

## Immediate Action Plan

### CRITICAL: Do NOT attempt to add the 2TB drive until the suspended pool is resolved!

Adding drives to a suspended pool can cause data loss. Follow this order:

1. **First**: Resolve the suspended ZFS pool
2. **Second**: Restore Nextcloud functionality  
3. **Third**: Add the 2TB drive safely

## Step 1: Diagnose and Fix Suspended ZFS Pool

### Run Diagnostic Script

```bash
# Navigate to the scripts directory
cd /path/to/docs/sysadmin/scripts/

# Run comprehensive ZFS diagnostics
sudo ./zfs-diagnostics.sh storage

# This will create detailed logs and provide specific recommendations
```

### Manual Diagnosis Steps

```bash
# 1. Check current pool status
sudo zpool status storage

# 2. Check for specific errors
sudo zpool status -v storage

# 3. Check ZFS events log
sudo zpool events | tail -20

# 4. Check system logs for I/O errors
sudo dmesg | grep -i error
sudo journalctl | grep -i "i/o error"
```

### Recovery Procedure for Suspended Pool

#### Option A: Clear Errors (Try this first)

```bash
# Attempt to clear pool errors
sudo zpool clear storage

# Check if pool becomes online
sudo zpool status storage

# If successful, start a scrub to verify integrity
sudo zpool scrub storage

# Monitor scrub progress
watch sudo zpool status storage
```

#### Option B: Force Import (If Option A fails)

```bash
# Export the pool first (if possible)
sudo zpool export storage 2>/dev/null

# Force import with recovery
sudo zpool import -F storage

# Check result
sudo zpool status storage

# If successful, run scrub immediately
sudo zpool scrub storage
```

#### Option C: Device-Specific Recovery

If specific devices show errors:

```bash
# Check which devices have errors
sudo zpool status -v storage

# For each failed device, check SMART status
sudo smartctl -a /dev/sdX  # Replace X with actual device

# If drive is failing, you may need to replace it
# (This is where your 2TB drive could be used as a replacement)
```

## Step 2: Restore Nextcloud Functionality

Once the ZFS pool is healthy (state: ONLINE), restore Nextcloud:

```bash
# Use the Nextcloud management script
sudo ./nextcloud-management.sh health

# If health check fails, restart services
sudo ./nextcloud-management.sh restart

# Verify functionality
sudo ./nextcloud-management.sh status
```

### Manual Nextcloud Recovery

If the script doesn't work:

```bash
# 1. Check mount points
mount | grep storage_data

# 2. If mount is missing, recreate it
sudo mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data

# 3. Start Nextcloud services
sudo systemctl start snap.nextcloud.redis-server
sudo systemctl start snap.nextcloud.php-fpm
sudo systemctl start snap.nextcloud.apache

# 4. Check service status
sudo systemctl status snap.nextcloud.*

# 5. Test web access
curl -I http://localhost/nextcloud/
```

## Step 3: Add 2TB Drive (Only after Steps 1 & 2 are complete)

### Verify Pool Health First

```bash
# Pool MUST be online before adding drives
sudo zpool status storage

# Expected output should show "state: ONLINE"
```

### Add the 2TB Drive

```bash
# Check that the drive is available
ls -la /mnt/cloud_drive/

# Add drive to the pool
sudo zpool add storage /mnt/cloud_drive

# Verify addition was successful
sudo zpool status storage
sudo zpool list storage

# Check new capacity
df -h /storage
```

## Detailed Troubleshooting Scenarios

### Scenario 1: Pool won't come online after clearing errors

```bash
# Check for hardware issues
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdb
# (Check all pool devices)

# Look for failing drives
sudo smartctl -t short /dev/sdX

# If drives are healthy, try force import with more aggressive options
sudo zpool import -f -F storage

# Last resort: Import with missing devices (DATA RISK!)
sudo zpool import -f -m storage
```

### Scenario 2: Nextcloud won't start after pool recovery

```bash
# Check data directory permissions
sudo ls -la /storage/nextcloud_data/
sudo chown -R root:root /storage/nextcloud_data/

# Verify mount point
mount | grep storage_data

# Check Nextcloud configuration
sudo nextcloud.occ config:system:get datadirectory

# Reset Nextcloud configuration if needed
sudo nextcloud.occ config:system:set datadirectory --value="/var/snap/nextcloud/common/storage_data"

# Run file scan
sudo nextcloud.occ files:scan --all
```

### Scenario 3: Data corruption detected

```bash
# If scrub finds errors:
sudo zpool status -v storage

# For correctable errors, scrub will fix them automatically
# For uncorrectable errors, you may need to restore from backup

# Check available snapshots
sudo zfs list -t snapshot

# Restore from snapshot if needed (CAUTION: This will lose recent changes)
sudo zfs rollback storage/nextcloud_data@snapshot_name
```

## Emergency Procedures

### If Pool Cannot Be Recovered

```bash
# 1. Document current state
sudo zpool status > /tmp/pool-failure-$(date +%Y%m%d).log
sudo zpool events >> /tmp/pool-failure-$(date +%Y%m%d).log

# 2. Attempt data rescue (if pool is readable)
sudo rsync -av /storage/nextcloud_data/ /backup/emergency-rescue/

# 3. If pool is completely failed, restore from backup
# See emergency-recovery.md for detailed procedures
```

### Alternative: Use 2TB Drive as Replacement

If a drive in the pool has failed:

```bash
# Replace failed drive with the 2TB drive
sudo zpool replace storage /dev/failed_device /mnt/cloud_drive

# Monitor replacement progress
watch sudo zpool status storage

# This is safer than adding to a degraded pool
```

## Verification Checklist

After completing recovery:

```bash
# ✅ ZFS pool status
sudo zpool status storage | grep "state: ONLINE"

# ✅ No pool errors
sudo zpool status -v storage | grep "errors: No known data errors"

# ✅ Mount points active
mount | grep storage_data

# ✅ Nextcloud services running
sudo systemctl status snap.nextcloud.*

# ✅ Web interface accessible
curl -I http://localhost/nextcloud/

# ✅ Data integrity
sudo nextcloud.occ integrity:check-core

# ✅ File access working
sudo nextcloud.occ files:scan --all
```

## Prevention for Future

### Set up monitoring

```bash
# Enable comprehensive monitoring
sudo ./nextcloud-management.sh enable-monitoring

# Set up ZFS health alerts
cat > /usr/local/bin/zfs-health-alert.sh << 'EOF'
#!/bin/bash
STATUS=$(zpool status storage | grep "state:" | awk '{print $2}')
if [[ "$STATUS" != "ONLINE" ]]; then
    logger -p daemon.crit "ZFS ALERT: Pool status is $STATUS"
    # Add email notification if configured
fi
EOF

chmod +x /usr/local/bin/zfs-health-alert.sh
echo "*/10 * * * * /usr/local/bin/zfs-health-alert.sh" | sudo crontab -
```

### Regular maintenance

```bash
# Schedule monthly scrubs
echo "0 2 1 * * /sbin/zpool scrub storage" | sudo crontab -

# Schedule weekly SMART checks
echo "0 3 * * 0 /usr/local/bin/smart-check.sh" | sudo crontab -
```

## Quick Reference Commands

```bash
# Check pool health
sudo zpool status storage

# Clear pool errors
sudo zpool clear storage

# Force import pool
sudo zpool import -F storage

# Start Nextcloud services
sudo systemctl start snap.nextcloud.*

# Check Nextcloud health
sudo ./nextcloud-management.sh health

# Add drive to pool (only when healthy!)
sudo zpool add storage /mnt/cloud_drive

# Monitor pool operations
watch sudo zpool status storage
```

## When to Seek Professional Help

Contact a data recovery professional if:
- Multiple drives show SMART failures
- Pool cannot be imported even with force options
- Scrub shows uncorrectable errors on critical data
- Physical hardware damage is suspected

## Summary for Your Specific Case

Based on your situation, follow this exact sequence:

1. **Run diagnostics**: `sudo ./zfs-diagnostics.sh storage`
2. **Clear pool errors**: `sudo zpool clear storage`
3. **If that fails, force import**: `sudo zpool import -F storage`
4. **Verify pool is online**: `sudo zpool status storage`
5. **Start scrub**: `sudo zpool scrub storage`
6. **Restore Nextcloud**: `sudo ./nextcloud-management.sh restart`
7. **Verify Nextcloud**: Test web interface access
8. **Only then add 2TB drive**: `sudo zpool add storage /mnt/cloud_drive`

**Remember**: Never add drives to a pool that isn't healthy. Fix the suspended state first, then expand.