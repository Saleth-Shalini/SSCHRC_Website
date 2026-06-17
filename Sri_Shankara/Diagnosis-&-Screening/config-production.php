<?php
// Production Configuration for Live Server
// Update these values for your live server

$live_path = '/home/az5v0bah4rbd/email_credentials.php';
$local_path = __DIR__ . '/../email_credentials.php';
$creds_file = file_exists($live_path) ? $live_path : $local_path;
$creds = require $creds_file;

return [
    'sschrc' => [
        'gmail_user' => $creds['email'],
        'gmail_pass' => $creds['password'],
        'recipient_email' => $creds['email'],
        'from_name' => 'Sri Shankara Cancer Hospital'
    ],
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 465,
        'encryption' => 'ssl',
        'timeout' => 30
    ],
    'security' => [
        'max_file_size' => 5242880, // 5MB
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'pdf'],
        'rate_limit' => 5 // Max 5 submissions per hour per IP
    ]
];
?>
