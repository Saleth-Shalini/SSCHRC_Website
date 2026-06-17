<?php
// Configuration file for SSCHRC email functionality
// This uses the same Gmail setup as other working forms in the project

$live_path = '/home/az5v0bah4rbd/email_credentials.php';
$local_path = __DIR__ . '/../email_credentials.php';
$creds_file = file_exists($live_path) ? $live_path : $local_path;
$creds = require $creds_file;

return [
    'sschrc' => [
        'gmail_user' => $creds['email'],
        'gmail_pass' => $creds['password']
    ]
];
?>
