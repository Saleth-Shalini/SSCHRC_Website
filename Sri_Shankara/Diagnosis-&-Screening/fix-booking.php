<?php
// Auto-fix script for cancer-screening-booking.php
// Run this if the main file gets corrupted

$backupFile = __DIR__ . '/cancer-screening-booking-backup.php';
$mainFile = __DIR__ . '/cancer-screening-booking.php';

if (file_exists($backupFile)) {
    copy($backupFile, $mainFile);
    echo "✅ Fixed! cancer-screening-booking.php has been restored from backup.\n";
    echo "The form should now work properly.\n";
} else {
    echo "❌ Backup file not found. Please contact support.\n";
}
?>
