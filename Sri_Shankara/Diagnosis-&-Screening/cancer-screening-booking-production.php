<?php
// Cancer Screening Package Booking Script - Production Version
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load PHPMailer
require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

// Load configuration
$config = require __DIR__ . '/config-production.php';

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Rate limiting (simple implementation)
session_start();
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rate_limit_key = 'rate_limit_' . $ip;
$current_time = time();
$rate_limit_window = 3600; // 1 hour

if (isset($_SESSION[$rate_limit_key])) {
    $last_submission = $_SESSION[$rate_limit_key];
    if (($current_time - $last_submission) < $rate_limit_window) {
        $remaining_time = $rate_limit_window - ($current_time - $last_submission);
        http_response_code(429);
        echo "ERROR: Too many requests. Please try again in " . ceil($remaining_time / 60) . " minutes.";
        exit;
    }
}

// Set rate limit
$_SESSION[$rate_limit_key] = $current_time;

$recipient = $config['sschrc']['recipient_email'];
$subject   = "New Cancer Screening Package Booking - Sri Shankara Cancer Hospital";

function clean_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function safe_string($str) {
    return preg_replace('/[\r\n]+/', ' ', $str);
}

function validate_phone($phone) {
    $cleaned = preg_replace('/\D/', '', $phone);
    return preg_match('/^\d{10}$/', $cleaned);
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Check for honeypot (spam protection)
if (!empty($_POST['website'] ?? '')) {
    http_response_code(400);
    exit("Bad Request");
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit("Method Not Allowed");
}

// Collect and validate form data
$patientName = clean_input($_POST['patientName'] ?? '');
$patientPhone = clean_input($_POST['patientPhone'] ?? '');
$patientEmail = !empty($_POST['patientEmail']) ? filter_var($_POST['patientEmail'], FILTER_VALIDATE_EMAIL) : '';
$patientAge = clean_input($_POST['patientAge'] ?? '');
$patientGender = clean_input($_POST['patientGender'] ?? '');
$appointmentDate = clean_input($_POST['appointmentDate'] ?? '');
$specialInstructions = clean_input($_POST['specialInstructions'] ?? '');
$packageName = clean_input($_POST['packageName'] ?? '');

// Validation
$errors = [];

if ($patientName === '' || strlen($patientName) < 2) {
    $errors[] = "Invalid patient name.";
}

if (!validate_phone($patientPhone)) {
    $errors[] = "Valid 10-digit phone number is required.";
}

// Email is optional, but if provided must be valid
if (!empty($_POST['patientEmail']) && !$patientEmail) {
    $errors[] = "Invalid email address.";
}

if ($patientAge === '' || !is_numeric($patientAge) || $patientAge < 1 || $patientAge > 120) {
    $errors[] = "Valid age (1-120) is required.";
}

if (!in_array(strtolower($patientGender), ['male', 'female', 'other'])) {
    $errors[] = "Gender selection is required.";
}

if ($appointmentDate === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $appointmentDate)) {
    $errors[] = "Appointment date is required.";
}

if ($packageName === '') {
    $errors[] = "Package selection is required.";
}

// Check for future date
if ($appointmentDate !== '' && strtotime($appointmentDate) < strtotime('today')) {
    $errors[] = "Appointment date must be in the future.";
}

if (!empty($errors)) {
    http_response_code(400);
    echo "Error: " . implode(" | ", $errors);
    exit;
}

// Prepare email content
$body  = "New Cancer Screening Package Booking\n";
$body .= "=====================================\n";
$body .= "Package Name     : " . safe_string($packageName) . "\n";
$body .= "Patient Name     : " . safe_string($patientName) . "\n";
$body .= "Phone Number     : " . safe_string($patientPhone) . "\n";
$body .= "Email Address    : " . ($patientEmail ? safe_string($patientEmail) : "N/A") . "\n";
$body .= "Age              : " . safe_string($patientAge) . " years\n";
$body .= "Gender           : " . ucfirst(safe_string($patientGender)) . "\n";
$body .= "Preferred Date   : " . safe_string($appointmentDate) . "\n";
$body .= "Special Notes    : " . ($specialInstructions ?: "None") . "\n";
$body .= "=====================================\n";
$body .= "Submitted on: " . date("d-m-Y H:i:s") . "\n";
$body .= "IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";
$body .= "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "\n";

// Send email
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $config['smtp']['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['sschrc']['gmail_user'];
    $mail->Password   = $config['sschrc']['gmail_pass'];
    $mail->SMTPSecure = $config['smtp']['encryption'];
    $mail->Port       = $config['smtp']['port'];
    $mail->Timeout    = $config['smtp']['timeout'];

    $mail->setFrom($config['sschrc']['gmail_user'], $config['sschrc']['from_name']);
    $mail->addAddress($recipient);

    if ($patientEmail) {
        $mail->addReplyTo($patientEmail, $patientName);
    }

    $mail->isHTML(false);
    $mail->Subject = safe_string($subject);
    $mail->Body    = $body;

    $mail->send();
    
    // Log successful submission
    error_log("Booking submitted successfully for: " . $patientName . " (" . $patientEmail . ")");
    
    echo "SUCCESS: Thank you for your booking request. We will contact you soon to confirm your appointment!";
    
} catch (Exception $e) {
    http_response_code(500);
    error_log("Mailer Error: " . $mail->ErrorInfo);
    echo "ERROR: Could not send booking request. Please try again later.";
}
?>
