<?php
// subscribe.php - Newsletter Subscription Handler for GoDaddy Shared Hosting
// Works with PHP 7.0+ using native mail() function

// Security Headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed. Use POST request.'
    ]);
    exit;
}

// Configuration
$recipient_email = 'appointments@sschrc.org';
$site_name = 'Sri Shankara Cancer Hospital';

// Get and sanitize email input
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

// Validation: Check if email is empty
if (empty($email)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email address is required.'
    ]);
    exit;
}

// Validation: Check email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format. Please enter a valid email address.'
    ]);
    exit;
}

// Security: Prevent header injection
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
if (preg_match("/[\r\n]/", $email)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email address detected.'
    ]);
    exit;
}

// Prepare email content
$subject = 'New Newsletter Subscription - ' . $site_name;
$message = "New newsletter subscription received:\n\n";
$message .= "Email: " . $email . "\n";
$message .= "Date: " . date('Y-m-d H:i:s') . "\n";
$message .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$message .= "User Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown') . "\n";

// Email headers (prevent header injection)
$headers = array();
$headers[] = 'From: noreply@' . $_SERVER['HTTP_HOST'];
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

// Send email using PHP mail() function
$mail_sent = @mail(
    $recipient_email,
    $subject,
    $message,
    implode("\r\n", $headers)
);

// Return JSON response
if ($mail_sent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for subscribing! You will receive updates at ' . $email
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send subscription. Please try again later or contact support.'
    ]);
}

exit;
?>

