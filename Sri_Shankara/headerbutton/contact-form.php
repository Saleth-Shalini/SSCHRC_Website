<?php
// contact-form.php - Sri Shankara Cancer Hospital Contact Form Handler
// Compatible with GoDaddy cPanel shared hosting
// FIXED VERSION - Proper AJAX support

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 in production
ini_set('log_errors', 1);

// Security: Prevent direct access to this file without POST data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Method not allowed'
    ));
    exit;
}

// ============================================
// FIELD EXTRACTION FROM HTML FORM
// ============================================
// Matching exact "name" attributes from contact-us.html

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// ============================================
// VALIDATION: CHECK REQUIRED FIELDS
// ============================================
// Required fields: name, email, message
// Phone is optional

$required_fields = array(
    'name' => $name,
    'email' => $email,
    'message' => $message
);

$missing_fields = array();
foreach ($required_fields as $field => $value) {
    if (empty($value)) {
        $missing_fields[] = ucfirst($field);
    }
}

// If any required field is missing, stop and show error
if (!empty($missing_fields)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Please fill in all required fields: ' . implode(', ', $missing_fields)
    ));
    exit;
}

// ============================================
// VALIDATE EMAIL FORMAT
// ============================================
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Please enter a valid email address'
    ));
    exit;
}

// ============================================
// SANITIZE ALL INPUTS
// ============================================
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$phone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// ============================================
// EMAIL CONFIGURATION
// ============================================
$to_email = 'appointments@sschrc.org';
$subject = 'New Contact Form Submission - ' . date('Y-m-d H:i:s');
$from_email = 'noreply@sschrc.org';

// ============================================
// EMAIL BODY - ALL FIELDS LISTED
// ============================================
$email_body = "==================================================\n";
$email_body .= "NEW CONTACT FORM SUBMISSION\n";
$email_body .= "==================================================\n\n";
$email_body .= "Date & Time: " . date('Y-m-d H:i:s') . "\n\n";
$email_body .= "CONTACT DETAILS:\n";
$email_body .= "-------------------\n";
$email_body .= "Full Name: " . $name . "\n";
$email_body .= "Email Address: " . $email . "\n";
$email_body .= "Phone Number: " . ($phone ? $phone : 'Not provided') . "\n\n";
$email_body .= "MESSAGE:\n";
$email_body .= "-------------------\n";
$email_body .= $message . "\n\n";
$email_body .= "==================================================\n";
$email_body .= "Source: Contact Us Page (contact-us.html)\n";
$email_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "==================================================\n";

// ============================================
// EMAIL HEADERS (GoDaddy Compatible)
// ============================================
$headers = array();
$headers[] = "From: Sri Shankara Contact Form <" . $from_email . ">";
$headers[] = "Reply-To: " . $name . " <" . $email . ">";
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers[] = "X-Mailer: PHP/" . phpversion();
$headers[] = "X-Priority: 3";

// ============================================
// SEND EMAIL
// ============================================
$mail_sent = @mail($to_email, $subject, $email_body, implode("\r\n", $headers));

// ============================================
// RESPONSE HANDLING - Always return JSON
// ============================================
header('Content-Type: application/json; charset=utf-8');

if ($mail_sent) {
    http_response_code(200);
    echo json_encode(array(
        'status' => 'success',
        'message' => 'Thank you for contacting us! Your message has been received. We will get back to you shortly.'
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'An error occurred while submitting your request. Please try again later or contact us directly at queries@sschrc.org'
    ));
}
exit;
?>

