# ZFS Troubleshooting Guide

This guide provides comprehensive troubleshooting procedures for ZFS storage issues, with a focus on resolving suspended pool states and I/O errors.

## Table of Contents

1. [Immediate Assessment](#immediate-assessment)
2. [Suspended Pool Recovery](#suspended-pool-recovery)
3. [Device Error Diagnosis](#device-error-diagnosis)
4. [Recovery Procedures](#recovery-procedures)
5. [Prevention Strategies](#prevention-strategies)

## Immediate Assessment

### Check Pool Status
```bash
# Check overall pool status
sudo zpool status

# Check detailed pool status with verbose output
sudo zpool status -v

# Check pool history for recent events
sudo zpool history
```

### Check System Resources
```bash
# Check disk space
df -h

# Check system memory
free -h

# Check system load
uptime

# Check for kernel messages
dmesg | grep -i zfs
dmesg | grep -i error
```

## Suspended Pool Recovery

### Understanding Suspended State

A ZFS pool enters "SUSPENDED" state when:
- Critical I/O errors occur
- Too many devices fail simultaneously
- Corruption is detected that ZFS cannot automatically repair

### Step-by-Step Recovery

#### 1. Identify the Problem
```bash
# Get detailed pool status
sudo zpool status -v storage

# Check for specific error messages
sudo zpool events -v

# Check ZFS kernel module status
lsmod | grep zfs
```

#### 2. Clear Transient Errors
```bash
# Clear errors if they appear to be transient
sudo zpool clear storage

# Check if pool becomes available
sudo zpool status storage
```

#### 3. Force Pool Import (if needed)
```bash
# If pool is not imported, try force import
sudo zpool import -f storage

# If that fails, try with different options
sudo zpool import -F storage
```

#### 4. Scrub and Repair
```bash
# Start a scrub to identify and repair issues
sudo zpool scrub storage

# Monitor scrub progress
watch sudo zpool status storage
```

## Device Error Diagnosis

### SMART Health Check
```bash
# Check SMART status for all drives
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdb
# Repeat for all drives in the pool

# Run short SMART test
sudo smartctl -t short /dev/sda

# Run extended SMART test (takes longer)
sudo smartctl -t long /dev/sda
```

### I/O Error Investigation
```bash
# Check for I/O errors in system logs
sudo journalctl -u zfs-mount.service
sudo journalctl | grep -i "i/o error"

# Check ZFS event log
sudo zpool events | grep error

# Check filesystem integrity
sudo zpool scrub storage
```

### Cable and Connection Check
```bash
# Check drive detection
lsblk
sudo fdisk -l

# Check SATA/NVMe connection status
dmesg | grep -i sata
dmesg | grep -i nvme

# Check drive temperatures (if supported)
sudo hddtemp /dev/sd*
```

## Recovery Procedures

### Procedure 1: Clear Errors and Resume
```bash
#!/bin/bash
echo "Starting ZFS pool recovery procedure..."

# Step 1: Clear errors
echo "Clearing pool errors..."
sudo zpool clear storage

# Step 2: Check status
echo "Checking pool status..."
sudo zpool status storage

# Step 3: Start scrub if pool is online
if zpool status storage | grep -q "state: ONLINE"; then
    echo "Pool is online, starting scrub..."
    sudo zpool scrub storage
else
    echo "Pool is not online, attempting import..."
    sudo zpool import -f storage
fi

echo "Recovery procedure complete. Check pool status."
```

### Procedure 2: Force Import with Recovery
```bash
#!/bin/bash
echo "Starting forced import recovery..."

# Export pool first (if possible)
sudo zpool export storage 2>/dev/null

# Attempt forced import
echo "Attempting forced import..."
sudo zpool import -F storage

# Check result
sudo zpool status storage

# If successful, run scrub
if zpool status storage | grep -q "ONLINE\|DEGRADED"; then
    echo "Import successful, starting scrub..."
    sudo zpool scrub storage
else
    echo "Import failed. Manual intervention required."
    exit 1
fi
```

### Procedure 3: Device Replacement
```bash
#!/bin/bash
# Use this if a specific device has failed

POOL_NAME="storage"
FAILED_DEVICE="/dev/sda"  # Replace with actual failed device
NEW_DEVICE="/dev/sde"     # Replace with new device

echo "Replacing failed device in ZFS pool..."

# Check pool status first
sudo zpool status $POOL_NAME

# Replace the device
echo "Replacing $FAILED_DEVICE with $NEW_DEVICE..."
sudo zpool replace $POOL_NAME $FAILED_DEVICE $NEW_DEVICE

# Monitor replacement progress
echo "Monitoring replacement progress..."
watch sudo zpool status $POOL_NAME
```

## Advanced Recovery Options

### Backup and Restore (Last Resort)
```bash
# If pool cannot be recovered, backup what's possible
sudo zfs send storage/dataset@snapshot > /backup/dataset.zfs

# After hardware issues are resolved, restore
sudo zfs receive storage/dataset < /backup/dataset.zfs
```

### Pool Recreation
```bash
# If all else fails, recreate pool (DATA LOSS!)
sudo zpool destroy storage  # WARNING: This destroys all data
sudo zpool create storage raidz /dev/sda /dev/sdb /dev/sdc
```

## Prevention Strategies

### Regular Health Monitoring
```bash
# Add to crontab for regular monitoring
# 0 2 * * 0 /usr/local/bin/zfs-health-check.sh

#!/bin/bash
# zfs-health-check.sh
POOL="storage"

# Check pool health
STATUS=$(zpool status $POOL | grep state)
if [[ $STATUS == *"ONLINE"* ]]; then
    echo "$(date): Pool $POOL is healthy"
else
    echo "$(date): WARNING - Pool $POOL status: $STATUS" | mail -s "ZFS Alert" admin@example.com
fi

# Check scrub status
SCRUB=$(zpool status $POOL | grep scrub)
echo "$(date): Scrub status: $SCRUB"
```

### Proactive Maintenance
```bash
# Monthly scrub (add to crontab)
# 0 2 1 * * /sbin/zpool scrub storage

# Weekly SMART checks
# 0 3 * * 0 /usr/local/bin/smart-check.sh

#!/bin/bash
# smart-check.sh
for drive in /dev/sd[a-z]; do
    if [ -e "$drive" ]; then
        echo "Checking $drive..."
        sudo smartctl -H "$drive"
        if [ $? -ne 0 ]; then
            echo "SMART failure detected on $drive" | mail -s "Drive Alert" admin@example.com
        fi
    fi
done
```

## Troubleshooting Common Issues

### Issue: Pool won't import
**Solution:**
```bash
# Check for pools available for import
sudo zpool import

# Force import with different options
sudo zpool import -f -F storage
sudo zpool import -f -R /mnt storage
```

### Issue: Constant I/O errors
**Solution:**
```bash
# Check and replace failing drives immediately
sudo zpool status -v storage

# Replace failing drive
sudo zpool replace storage old_device new_device
```

### Issue: Performance degradation
**Solution:**
```bash
# Check for ongoing scrub or resilver
sudo zpool status storage

# Check system load and I/O wait
iostat -x 1

# Optimize ZFS settings if needed
echo 1 > /sys/module/zfs/parameters/zfs_prefetch_disable
```

## Emergency Contacts and Resources

- ZFS Documentation: https://openzfs.github.io/openzfs-docs/
- Emergency backup procedures: See `backup-restore.md`
- System administrator contact: [Add contact information]

## Log Files and Diagnostics

Important log locations:
- `/var/log/kern.log` - Kernel messages including ZFS errors
- `/var/log/syslog` - System log
- `zpool events` - ZFS event log
- `dmesg` - Kernel ring buffer

Save diagnostic output:
```bash
# Create comprehensive diagnostic report
sudo zpool status -v > /tmp/zfs-diagnostic.txt
sudo zpool events >> /tmp/zfs-diagnostic.txt
dmesg | grep -i zfs >> /tmp/zfs-diagnostic.txt
sudo smartctl -a /dev/sd* >> /tmp/zfs-diagnostic.txt
```

---

**Important:** Always ensure you have current backups before attempting any recovery procedures. When in doubt, consult with experienced ZFS administrators or consider professional data recovery services for critical data.