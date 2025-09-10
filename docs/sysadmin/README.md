# System Administration Documentation

This directory contains comprehensive guides and scripts for system administration tasks, with a focus on Nextcloud and ZFS storage management.

## Contents

### ZFS Storage Management
- [ZFS Troubleshooting Guide](zfs-troubleshooting.md) - Comprehensive guide for diagnosing and fixing ZFS pool issues
- [ZFS Pool Expansion Guide](zfs-pool-expansion.md) - Step-by-step guide for adding drives to ZFS pools
- [ZFS Diagnostic Scripts](scripts/zfs-diagnostics.sh) - Automated diagnostic tools for ZFS health checking

### Nextcloud Administration
- [Nextcloud Migration Guide](nextcloud-migration.md) - Complete guide for migrating Nextcloud data directories
- [Nextcloud Troubleshooting](nextcloud-troubleshooting.md) - Common issues and solutions for Nextcloud
- [Nextcloud Service Management](scripts/nextcloud-management.sh) - Scripts for managing Nextcloud services

### Emergency Procedures
- [Emergency Recovery Procedures](emergency-recovery.md) - Critical procedures for system recovery
- [Backup and Restore Procedures](backup-restore.md) - Comprehensive backup and restore strategies

## Quick Start

For immediate troubleshooting of the current issue (suspended ZFS pool and Nextcloud migration):

1. Run the ZFS diagnostic script: `./scripts/zfs-diagnostics.sh`
2. Follow the emergency recovery procedures if needed
3. Use the Nextcloud migration guide for data directory issues
4. Use the ZFS pool expansion guide to add the 2TB drive

## Support

These guides are designed to be comprehensive and self-contained. Each guide includes:
- Problem identification steps
- Diagnostic procedures
- Step-by-step solutions
- Prevention strategies
- Recovery procedures

Always ensure you have proper backups before making any system changes.