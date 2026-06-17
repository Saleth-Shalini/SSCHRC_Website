<?php
/**
 * Newsletter Subscription Handler for Inner Pages
 * Sri Shankara Cancer Hospital & Research Centre
 * 
 * Compatible with: GoDaddy Shared Hosting, PHP 7+
 * Uses: Native PHP mail() function only
 */

// Security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit;
}

// Get email from POST data
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

// Validate email is not empty
if (empty($email)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your email address.'
    ]);
    exit;
}

// Sanitize email
$email = filter_var($email, FILTER_SANITIZE_EMAIL);

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ]);
    exit;
}

// Additional security: Check for header injection attempts
if (preg_match("/[\r\n]/", $email)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format detected.'
    ]);
    exit;
}

// Email configuration
$to = 'appointments@sschrc.org';
$subject = 'New Newsletter Subscription - Inner Page';

// Email body
$message = "New Newsletter Subscription\n\n";
$message .= "Email: " . $email . "\n";
$message .= "Date: " . date('Y-m-d H:i:s') . "\n";
$message .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$message .= "User Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'N/A') . "\n";
$message .= "Referrer: " . (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'N/A') . "\n";

// Email headers
$headers = array();
$headers[] = 'From: Newsletter Subscription <noreply@' . $_SERVER['HTTP_HOST'] . '>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

// Convert headers array to string
$headersString = implode("\r\n", $headers);

// Send email using native mail() function
$mailSent = @mail($to, $subject, $message, $headersString);

// Return JSON response
if ($mailSent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for subscribing to our newsletter!'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send subscription request. Please try again later.'
    ]);
}

exit;
?>

