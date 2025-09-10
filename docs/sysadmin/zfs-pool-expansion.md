# ZFS Pool Expansion Guide

This guide provides step-by-step procedures for safely adding drives to existing ZFS pools, with a focus on expanding storage capacity while maintaining data integrity.

## Table of Contents

1. [Pre-Expansion Planning](#pre-expansion-planning)
2. [Safety Procedures](#safety-procedures)
3. [Adding Drives to Pools](#adding-drives-to-pools)
4. [Verification and Testing](#verification-and-testing)
5. [Troubleshooting](#troubleshooting)

## Pre-Expansion Planning

### Prerequisites

Before adding any drives to a ZFS pool:

1. **Pool must be healthy and online**
2. **Complete backup of all data**
3. **New drive(s) properly connected and detected**
4. **Sufficient power supply for additional drives**
5. **Pool not in suspended or faulted state**

### Initial Assessment

```bash
# Check current pool status
sudo zpool status storage

# Check pool capacity and usage
sudo zpool list storage

# Verify new drive is detected
lsblk
sudo fdisk -l

# Check SMART health of new drive
sudo smartctl -H /dev/sda  # Replace with actual device
```

### Drive Preparation

```bash
# Identify the new drive (example: /dev/sda)
NEW_DRIVE="/dev/sda"

# Verify drive is not mounted or in use
mount | grep $NEW_DRIVE
lsof | grep $NEW_DRIVE

# Check drive health
sudo smartctl -a $NEW_DRIVE

# Optionally wipe the drive for security
sudo dd if=/dev/zero of=$NEW_DRIVE bs=1M count=100
```

## Safety Procedures

### Backup Verification

```bash
# Ensure recent backup exists
ls -la /backup/
sudo zfs list -t snapshot

# Create a new snapshot before expansion
sudo zfs snapshot storage/nextcloud_data@before_expansion_$(date +%Y%m%d)

# Verify snapshot was created
sudo zfs list -t snapshot
```

### System Resource Check

```bash
# Check available memory (ZFS expansion can be memory intensive)
free -h

# Check system load
uptime

# Ensure no other intensive operations are running
ps aux | grep -E "(scrub|resilver|backup)"
```

## Adding Drives to Pools

### Method 1: Adding as New VDEV (Recommended for most cases)

This method adds the drive as a new VDEV, which increases both capacity and performance:

```bash
POOL_NAME="storage"
NEW_DRIVE="/dev/sda"

# Add drive as single device VDEV
sudo zpool add $POOL_NAME $NEW_DRIVE

# Verify addition was successful
sudo zpool status $POOL_NAME
sudo zpool list $POOL_NAME
```

### Method 2: Expanding Existing RAIDZ VDEV

**Warning:** This is only possible if you're expanding a mirror or adding to a compatible RAIDZ configuration.

```bash
# For mirror expansion (converting single disk to mirror)
sudo zpool attach storage existing_device new_device

# For RAIDZ expansion (requires ZFS 2.2+)
sudo zpool add storage raidz existing_vdev new_device
```

### Method 3: Creating New Mirror VDEV

```bash
# Add two drives as a mirrored VDEV
sudo zpool add storage mirror /dev/sda /dev/sdb

# Verify mirror was created correctly
sudo zpool status storage
```

### Method 4: Adding to Existing Pool as Spare

```bash
# Add drive as hot spare
sudo zpool add storage spare /dev/sda

# Verify spare was added
sudo zpool status storage
```

## Step-by-Step Expansion Process

### For Adding Single Drive (Most Common Scenario)

```bash
#!/bin/bash
# Automated pool expansion script

set -euo pipefail

POOL_NAME="storage"
NEW_DRIVE="/mnt/cloud_drive"  # As mentioned in the problem statement
LOG_FILE="/var/log/zfs-expansion-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

log "Starting ZFS pool expansion process"

# Step 1: Pre-expansion checks
log "Step 1: Running pre-expansion checks"

if ! zpool status "$POOL_NAME" | grep -q "state: ONLINE"; then
    log "ERROR: Pool is not online. Aborting expansion."
    exit 1
fi

if [[ ! -b "$NEW_DRIVE" ]] && [[ ! -d "$NEW_DRIVE" ]]; then
    log "ERROR: Drive $NEW_DRIVE not found. Aborting expansion."
    exit 1
fi

# Step 2: Create pre-expansion snapshot
log "Step 2: Creating pre-expansion snapshot"
sudo zfs snapshot -r "$POOL_NAME@before_expansion_$(date +%Y%m%d_%H%M%S)"

# Step 3: Add drive to pool
log "Step 3: Adding drive to pool"
sudo zpool add "$POOL_NAME" "$NEW_DRIVE"

# Step 4: Verify addition
log "Step 4: Verifying addition"
if zpool status "$POOL_NAME" | grep -q "$NEW_DRIVE"; then
    log "SUCCESS: Drive successfully added to pool"
else
    log "ERROR: Drive addition failed"
    exit 1
fi

# Step 5: Check pool health
log "Step 5: Checking pool health"
sudo zpool status "$POOL_NAME"

log "Pool expansion completed successfully"
log "New pool capacity: $(zpool list -H -o size "$POOL_NAME")"
```

## Verification and Testing

### Post-Expansion Verification

```bash
# Check pool status and new capacity
sudo zpool status storage
sudo zpool list storage

# Verify new space is available
df -h /storage

# Check that all datasets are accessible
sudo zfs list

# Test write performance to new capacity
sudo dd if=/dev/zero of=/storage/test_large_file bs=1M count=1000
sudo rm /storage/test_large_file
```

### Performance Testing

```bash
# Test I/O performance on expanded pool
sudo hdparm -tT /storage

# Monitor I/O distribution across devices
iostat -x 1 10

# Check ZFS cache statistics
sudo cat /proc/spl/kstat/zfs/arcstats
```

### Data Integrity Verification

```bash
# Run a scrub to verify data integrity across all devices
sudo zpool scrub storage

# Monitor scrub progress
watch sudo zpool status storage

# Verify no errors after scrub completion
sudo zpool status -v storage
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Drive Addition Fails

**Error:** `cannot add to 'storage': vdev specification invalid`

**Solution:**
```bash
# Check if drive is already in use
sudo zpool status -v
lsblk

# Clear any existing partitions
sudo wipefs -a /dev/sda

# Try adding again
sudo zpool add storage /dev/sda
```

#### Issue 2: Pool Becomes Degraded After Addition

**Solution:**
```bash
# Check which device caused the issue
sudo zpool status -v storage

# Remove the problematic device
sudo zpool remove storage /dev/sda

# Check device health before re-adding
sudo smartctl -a /dev/sda

# Fix any hardware issues and try again
```

#### Issue 3: No Space Increase After Addition

**Solution:**
```bash
# Check if device was added as spare instead of active device
sudo zpool status storage

# If added as spare, remove and re-add correctly
sudo zpool remove storage /dev/sda
sudo zpool add storage /dev/sda
```

#### Issue 4: Performance Degradation After Expansion

**Solution:**
```bash
# Check I/O distribution
iostat -x 1

# Rebalance data across devices (requires manual data movement)
sudo zfs send storage/dataset@snapshot | sudo zfs receive storage/temp_dataset
sudo zfs destroy storage/dataset
sudo zfs rename storage/temp_dataset storage/dataset

# Or wait for natural rebalancing during normal operations
```

### Recovery Procedures

If expansion causes issues:

```bash
# Remove the newly added device (if possible)
sudo zpool remove storage /dev/sda

# Restore from pre-expansion snapshot if needed
sudo zfs rollback storage@before_expansion_YYYYMMDD

# Check pool integrity
sudo zpool scrub storage
```

## Advanced Expansion Scenarios

### Expanding with Different Device Types

```bash
# Adding SSD cache device
sudo zpool add storage cache /dev/nvme0n1

# Adding log device (SLOG)
sudo zpool add storage log /dev/nvme0n2

# Verify special devices
sudo zpool status storage
```

### Online Pool Reshaping (ZFS 2.2+)

```bash
# For supported configurations, reshape RAIDZ
sudo zpool attach storage raidz-device new-device

# Monitor reshape progress
watch sudo zpool status storage
```

## Best Practices

### Planning Considerations

1. **Add drives of similar size for optimal space utilization**
2. **Consider redundancy when adding drives**
3. **Plan for future expansion when designing VDEV layout**
4. **Monitor performance after expansion**
5. **Document all changes made to the pool**

### Performance Optimization

```bash
# Optimize ZFS settings for expanded pool
echo 1 > /sys/module/zfs/parameters/zfs_vdev_scheduler

# Adjust ARC size if needed
echo 4294967296 > /sys/module/zfs/parameters/zfs_arc_max

# Set appropriate recordsize for your workload
sudo zfs set recordsize=1M storage/nextcloud_data
```

### Monitoring and Maintenance

```bash
# Set up regular monitoring of expanded pool
cat > /usr/local/bin/zfs-expansion-monitor.sh << 'EOF'
#!/bin/bash

POOL="storage"
LOG="/var/log/zfs-expansion-monitor.log"
DATE=$(date)

# Check pool health
STATUS=$(zpool status $POOL | grep "state:" | awk '{print $2}')
echo "$DATE: Pool status: $STATUS" >> $LOG

# Check capacity
CAPACITY=$(zpool list -H -o capacity $POOL)
echo "$DATE: Pool capacity: $CAPACITY" >> $LOG

# Alert if capacity exceeds 80%
if [[ ${CAPACITY%\%} -gt 80 ]]; then
    echo "$DATE: WARNING - Pool capacity high: $CAPACITY" >> $LOG
fi

# Check for errors
ERRORS=$(zpool status $POOL | grep "errors:" | awk '{print $2}')
if [[ "$ERRORS" != "No" ]]; then
    echo "$DATE: WARNING - Pool has errors: $ERRORS" >> $LOG
fi
EOF

chmod +x /usr/local/bin/zfs-expansion-monitor.sh

# Add to crontab
echo "0 * * * * /usr/local/bin/zfs-expansion-monitor.sh" | sudo crontab -
```

## Specific Case: Adding 2TB Drive to Current Setup

Based on the problem statement, here's the specific procedure for your case:

```bash
# Current situation: Adding /mnt/cloud_drive/ (2TB) to storage pool

# Step 1: Verify the pool is healthy first (critical!)
sudo zpool status storage

# Step 2: If pool is suspended, resolve that first
if zpool status storage | grep -q "SUSPENDED"; then
    echo "Pool is suspended - run ZFS diagnostics first"
    ./scripts/zfs-diagnostics.sh storage
    exit 1
fi

# Step 3: Verify new drive mount point
ls -la /mnt/cloud_drive/
df -h /mnt/cloud_drive/

# Step 4: Add the drive to the pool
sudo zpool add storage /mnt/cloud_drive

# Step 5: Verify addition
sudo zpool status storage
sudo zpool list storage

# Step 6: Update Nextcloud if needed to recognize new space
sudo nextcloud.occ files:scan --all
```

**Important:** Do not attempt to add the 2TB drive until the suspended pool issue is resolved. Use the ZFS troubleshooting guide and diagnostic script first.

---

**Critical Warning:** Never add drives to a pool that is in a suspended, faulted, or degraded state. Always resolve pool health issues first using the ZFS troubleshooting procedures.