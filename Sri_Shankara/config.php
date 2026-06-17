<?php
$live_path = '/home/az5v0bah4rbd/email_credentials.php';
$local_path = __DIR__ . '/email_credentials.php';
$creds_file = file_exists($live_path) ? $live_path : $local_path;
$creds = require $creds_file;

return [
    // Gmail SMTP (for sending; works on localhost; GoDaddy may block outbound)
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_secure' => 'tls',

    'smtp_username' => $creds['email'],
    'smtp_password' => $creds['password'],

    'from_email' => $creds['email'],
    'from_name'  => 'Sri Shankara Cancer Hospital',

    // Address that receives form submissions
    'admin_email' => $creds['email']
];
