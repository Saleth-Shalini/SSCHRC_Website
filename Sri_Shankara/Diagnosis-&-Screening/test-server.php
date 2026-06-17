<?php
// Server Test Script - Run this on your live server to verify setup
echo "<h2>🚀 Server Configuration Test</h2>";

// PHP Version Check
echo "<h3>PHP Version:</h3>";
echo "Current PHP Version: " . phpversion() . "<br>";
if (version_compare(phpversion(), '7.4.0', '>=')) {
    echo "✅ PHP version is compatible<br>";
} else {
    echo "❌ PHP version is too old. Need 7.4+<br>";
}

// PHPMailer Check
echo "<h3>PHPMailer Check:</h3>";
if (file_exists(__DIR__ . '/../PHPMailer/src/PHPMailer.php')) {
    echo "✅ PHPMailer found<br>";
} else {
    echo "❌ PHPMailer not found<br>";
}

// Configuration Check
echo "<h3>Configuration Check:</h3>";
if (file_exists(__DIR__ . '/config-production.php')) {
    echo "✅ Production config found<br>";
    $config = require __DIR__ . '/config-production.php';
    if (isset($config['sschrc']['gmail_user']) && $config['sschrc']['gmail_user'] !== '') {
        echo "✅ Gmail user configured<br>";
    } else {
        echo "❌ Gmail user not configured<br>";
    }
} else {
    echo "❌ Production config not found<br>";
}

// File Permissions
echo "<h3>File Permissions:</h3>";
$files_to_check = [
    'cancer-screening-booking-production.php',
    'config-production.php',
    '../PHPMailer/src/PHPMailer.php'
];

foreach ($files_to_check as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        if (is_readable(__DIR__ . '/' . $file)) {
            echo "✅ $file is readable<br>";
        } else {
            echo "❌ $file is not readable<br>";
        }
    } else {
        echo "❌ $file not found<br>";
    }
}

// SMTP Test (optional)
echo "<h3>SMTP Test:</h3>";
if (isset($_GET['test_smtp']) && $_GET['test_smtp'] === 'yes') {
    echo "Testing SMTP connection...<br>";
    
    try {
        require __DIR__ . '/../PHPMailer/src/Exception.php';
        require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
        require __DIR__ . '/../PHPMailer/src/SMTP.php';
        
        $config = require __DIR__ . '/config-production.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $config['smtp']['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $config['sschrc']['gmail_user'];
        $mail->Password = $config['sschrc']['gmail_pass'];
        $mail->SMTPSecure = $config['smtp']['encryption'];
        $mail->Port = $config['smtp']['port'];
        
        $mail->setFrom($config['sschrc']['gmail_user'], 'Test');
        $mail->addAddress($config['sschrc']['recipient_email']);
        $mail->Subject = 'Server Test Email';
        $mail->Body = 'This is a test email from your server.';
        
        $mail->send();
        echo "✅ SMTP test successful!<br>";
        
    } catch (Exception $e) {
        echo "❌ SMTP test failed: " . $e->getMessage() . "<br>";
    }
} else {
    echo "<a href='?test_smtp=yes'>Click here to test SMTP connection</a><br>";
}

echo "<hr>";
echo "<p><strong>Server Time:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Server IP:</strong> " . ($_SERVER['SERVER_ADDR'] ?? 'Unknown') . "</p>";
echo "<p><strong>Document Root:</strong> " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "</p>";
?>
