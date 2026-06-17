<?php
// =====================================================
// Book Appointment PHP Handler - OPTIMIZED
// FIXES: Fast Submission + Gmail Inbox Delivery
// =====================================================

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION - UPDATE THESE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
define('TO_EMAIL', 'appointments@sschrc.org');
define('FROM_EMAIL', 'noreply@srishankaracancerhospital.org');    // ⚠️ CHANGE yourdomain.com
define('FROM_NAME', 'Sri Shankara Hospital');
define('EMAIL_SUBJECT', 'New Book Appointment Lead');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Security & Headers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sanitization Function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function clean_input($data) {
    if (is_array($data)) {
        return array_map('clean_input', $data);
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Honeypot Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (!empty($_POST['website'])) {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Thank you! Your appointment request has been submitted successfully.']);
    exit;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Collect & Sanitize Fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$full_name = isset($_POST['full_name']) ? clean_input($_POST['full_name']) : '';
$age = isset($_POST['age']) ? clean_input($_POST['age']) : '';
$mobile = isset($_POST['mobile']) ? clean_input($_POST['mobile']) : '';
$email = isset($_POST['email']) ? clean_input($_POST['email']) : '';
$gender = isset($_POST['gender']) ? clean_input($_POST['gender']) : '';
$preferred_date = isset($_POST['preferred_date']) ? clean_input($_POST['preferred_date']) : '';
$preferred_date_formatted = isset($_POST['preferred_date_formatted']) ? clean_input($_POST['preferred_date_formatted']) : '';
$selectedDoctor = isset($_POST['selectedDoctor']) ? clean_input($_POST['selectedDoctor']) : '';
$notes = isset($_POST['notes']) ? clean_input($_POST['notes']) : '';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$errors = [];

if (empty($full_name)) {
    $errors[] = 'Full name is required';
}

if (empty($age) || !is_numeric($age) || $age < 0 || $age > 120) {
    $errors[] = 'Valid age is required (0-120)';
}

if (empty($mobile) || !preg_match('/^\d{10}$/', $mobile)) {
    $errors[] = 'Valid 10-digit mobile number is required';
}

if (empty($gender)) {
    $errors[] = 'Gender is required';
}

if (empty($preferred_date)) {
    $errors[] = 'Preferred date is required';
}

if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode(', ', $errors)]);
    exit;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Prepare Email Body
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$message_body = "New Appointment Request Received\n";
$message_body .= "=====================================\n\n";
$message_body .= "PATIENT DETAILS:\n";
$message_body .= "Full Name : " . $full_name . "\n";
$message_body .= "Age : " . $age . "\n";
$message_body .= "Mobile Number : " . $mobile . "\n";
$message_body .= "Email Address : " . ($email ? $email : 'Not provided') . "\n";
$message_body .= "Gender : " . $gender . "\n";
$message_body .= "Preferred Date : " . ($preferred_date_formatted ? $preferred_date_formatted : $preferred_date) . "\n";
$message_body .= "Doctor Name : " . ($selectedDoctor ? $selectedDoctor : 'Not specified') . "\n";
$message_body .= "Additional Notes : " . ($notes ? $notes : 'None') . "\n\n";
$message_body .= "=====================================\n";
$message_body .= "Submission Time : " . date('Y-m-d H:i:s') . "\n";
$message_body .= "IP Address : " . $_SERVER['REMOTE_ADDR'] . "\n";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPTIMIZED HEADERS - Anti-Spam Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$reply_to = !empty($email) ? $email : FROM_EMAIL;

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . $reply_to;
$headers[] = 'Return-Path: ' . FROM_EMAIL;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'X-Priority: 3';
$headers[] = 'Importance: Normal';

// SPF/DKIM Compatibility
if (isset($_SERVER['SERVER_NAME'])) {
    $headers[] = 'Message-ID: <' . time() . '.' . md5($mobile . $full_name) . '@' . $_SERVER['SERVER_NAME'] . '>';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST SEND - Using PHP mail() (Optimized)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$mail_sent = @mail(
    TO_EMAIL,
    EMAIL_SUBJECT,
    $message_body,
    implode("\r\n", $headers)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Response
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if ($mail_sent) {
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your appointment request has been submitted successfully. We will contact you shortly at ' . $mobile . '.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send appointment request. Please try again or call +91-7090521000.'
    ]);
}
exit;
?>
