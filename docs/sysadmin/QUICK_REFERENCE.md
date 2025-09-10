# Quick Reference Guide for Nextcloud/ZFS Issues

## 🚨 EMERGENCY: Suspended ZFS Pool & Down Nextcloud

### Immediate Action (Run This First!)

```bash
# Navigate to the scripts directory
cd docs/sysadmin/scripts/

# Run emergency recovery script
sudo ./emergency-recovery.sh
```

This script will automatically:
1. Document current system state
2. Assess ZFS pool condition  
3. Attempt pool recovery if suspended
4. Restore Nextcloud services
5. Provide next steps

---

## 📋 Step-by-Step Manual Recovery

If automatic recovery doesn't work:

### 1. Check Pool Status
```bash
sudo zpool status storage
```

### 2. Clear Pool Errors
```bash
sudo zpool clear storage
```

### 3. If Clear Fails, Force Import
```bash
sudo zpool export storage
sudo zpool import -F storage
```

### 4. Start Pool Scrub
```bash
sudo zpool scrub storage
```

### 5. Restore Nextcloud Services
```bash
sudo systemctl start snap.nextcloud.redis-server
sudo systemctl start snap.nextcloud.php-fpm  
sudo systemctl start snap.nextcloud.apache
```

### 6. Check Mount Points
```bash
# Verify bind mount is active
mount | grep storage_data

# If missing, recreate it
sudo mount --bind /storage/nextcloud_data /var/snap/nextcloud/common/storage_data
```

---

## ⚠️ CRITICAL: Do NOT Add 2TB Drive Until Pool Is Healthy!

Only after the pool shows `state: ONLINE`:

```bash
# Verify pool is healthy
sudo zpool status storage | grep "state: ONLINE"

# Add the 2TB drive
sudo zpool add storage /mnt/cloud_drive

# Verify addition
sudo zpool list storage
```

---

## 🔧 Useful Commands

### Check Status
```bash
# Pool status
sudo zpool status storage

# Service status  
sudo systemctl status snap.nextcloud.*

# Web interface test
curl -I http://localhost/nextcloud/

# Mount points
mount | grep storage_data
```

### Diagnostics
```bash
# Full diagnostics
sudo ./zfs-diagnostics.sh storage

# Health check
sudo ./nextcloud-management.sh health

# Service management
sudo ./nextcloud-management.sh restart
```

### Monitoring
```bash
# Watch pool operations
watch sudo zpool status storage

# Check logs
sudo journalctl -u snap.nextcloud.apache -f
```

---

## 📁 Complete Documentation

- **[ZFS Troubleshooting](zfs-troubleshooting.md)** - Comprehensive ZFS recovery procedures
- **[Nextcloud Migration](nextcloud-migration.md)** - Complete migration guide and troubleshooting
- **[Emergency Recovery](emergency-recovery.md)** - Critical emergency procedures
- **[Troubleshooting Manual](troubleshooting-guide.md)** - Specific procedures for your case

---

## 🆘 When to Seek Help

Contact professional data recovery if:
- Multiple drives show SMART failures
- Pool cannot be imported even with force options
- Scrub shows uncorrectable errors
- Physical hardware damage suspected

---

## ✅ Recovery Success Checklist

- [ ] ZFS pool status: ONLINE
- [ ] Pool scrub completes without errors
- [ ] Nextcloud services running
- [ ] Web interface accessible
- [ ] Mount points active
- [ ] File access working

**Only then proceed with adding the 2TB drive!**

---

## 📞 Emergency Contact Template

```bash
# Document system state for support
sudo zpool status > /tmp/emergency-status.log
sudo journalctl --since "1 hour ago" >> /tmp/emergency-status.log
sudo dmesg | grep -i error >> /tmp/emergency-status.log
```

Save `/tmp/emergency-status.log` when requesting help.