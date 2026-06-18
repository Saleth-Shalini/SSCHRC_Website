<?php
ob_start();
date_default_timezone_set('Asia/Kolkata');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

function send_response($success, $message, $code = 200) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code($code);
    header('Content-Type: text/plain; charset=UTF-8');
    echo ($success ? 'SUCCESS: ' : 'ERROR: ') . $message;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(false, 'Invalid request method. This file must be accessed via POST.', 405);
}

function sanitize_input($data) {
    if ($data === null || $data === '') {
        return '';
    }
    $data = trim($data);
    $data = stripslashes($data);
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

$packageName = sanitize_input($_POST['packageName'] ?? '');
$patientName = sanitize_input($_POST['patientName'] ?? '');
$patientPhone = sanitize_input($_POST['patientPhone'] ?? '');
$patientEmail = sanitize_input($_POST['patientEmail'] ?? '');
$patientAge = sanitize_input($_POST['patientAge'] ?? '');
$patientGender = sanitize_input($_POST['patientGender'] ?? '');
$appointmentDate = sanitize_input($_POST['appointmentDate'] ?? '');
$specialInstructions = sanitize_input($_POST['specialInstructions'] ?? '');

$required_fields = [
    'Package Name' => $packageName,
    'Patient Name' => $patientName,
    'Phone Number' => $patientPhone,
    'Age' => $patientAge,
    'Gender' => $patientGender,
    'Appointment Date' => $appointmentDate
];

$missing_fields = [];
foreach ($required_fields as $field_name => $field_value) {
    if ($field_value === '') {
        $missing_fields[] = $field_name;
    }
}

if (!empty($missing_fields)) {
    send_response(false, 'Missing required fields: ' . implode(', ', $missing_fields), 400);
}

if (!empty($patientEmail) && !filter_var($patientEmail, FILTER_VALIDATE_EMAIL)) {
    send_response(false, 'Invalid email address format.', 400);
}

if (!is_numeric($patientAge) || $patientAge < 1 || $patientAge > 120) {
    send_response(false, 'Invalid age. Must be between 1 and 120.', 400);
}

$phoneDigits = preg_replace('/\D/', '', $patientPhone);
if (!preg_match('/^\d{10}$/', $phoneDigits)) {
    send_response(false, 'Valid 10-digit phone number is required.', 400);
}
if (!preg_match('/^[6-9]/', $phoneDigits)) {
    send_response(false, 'Mobile number cannot start with 1, 2, 3, 4, or 5. Please enter a valid 10-digit Indian mobile number.', 400);
}
$patientPhone = $phoneDigits;

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $appointmentDate)) {
    send_response(false, 'Invalid appointment date format.', 400);
}
$selected_date = DateTime::createFromFormat('Y-m-d', $appointmentDate);
$today_date = new DateTime('today');
$max_date = (clone $today_date)->modify('+1 year');
if (!$selected_date || $selected_date < $today_date || $selected_date > $max_date) {
    send_response(false, 'Preferred date must be between today and one year from today.', 400);
}

$formatted_date = date('F j, Y', strtotime($appointmentDate));
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

$email_body = "==============================================\n";
$email_body .= "NEW CANCER SCREENING PACKAGE BOOKING REQUEST\n";
$email_body .= "==============================================\n\n";
$email_body .= "PACKAGE INFORMATION:\n";
$email_body .= "-------------------------------------------\n";
$email_body .= "Package Name: " . $packageName . "\n\n";
$email_body .= "PATIENT INFORMATION:\n";
$email_body .= "-------------------------------------------\n";
$email_body .= "Full Name: " . $patientName . "\n";
$email_body .= "Phone Number: " . $patientPhone . "\n";
$email_body .= "Email Address: " . ($patientEmail ?: 'Not Provided') . "\n";
$email_body .= "Age: " . $patientAge . " years\n";
$email_body .= "Gender: " . ucfirst($patientGender) . "\n\n";
$email_body .= "APPOINTMENT DETAILS:\n";
$email_body .= "-------------------------------------------\n";
$email_body .= "Preferred Date: " . $formatted_date . " (" . $appointmentDate . ")\n\n";

if ($specialInstructions !== '') {
    $email_body .= "SPECIAL INSTRUCTIONS:\n";
    $email_body .= "-------------------------------------------\n";
    $email_body .= $specialInstructions . "\n\n";
}

$email_body .= "==============================================\n";
$email_body .= "Submitted on: " . date('F j, Y g:i A') . "\n";
$email_body .= "IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";
$email_body .= "User Agent: " . $user_agent . "\n";
$email_body .= "==============================================\n";

$live_path = '/home/az5v0bah4rbd/email_credentials.php';
$local_path = __DIR__ . '/../email_credentials.php';
$creds_file = file_exists($live_path) ? $live_path : $local_path;

if (!file_exists($creds_file)) {
    error_log('cancer-screening-booking.php: email credentials file not found');
    send_response(false, 'Could not send booking request. Please try again or call +91-7090521000.', 500);
}

$creds = require $creds_file;
$recipient = 'appointments@sschrc.org';

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $creds['email'];
    $mail->Password = $creds['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->Timeout = 30;
    $mail->SMTPDebug = 0;

    $mail->setFrom($creds['email'], 'Sri Shankara Cancer Hospital');
    $mail->addAddress($recipient);
    if (!empty($patientEmail)) {
        $mail->addReplyTo($patientEmail, $patientName);
    }

    $mail->isHTML(false);
    $mail->Subject = 'New Cancer-Screening-Packages Lead';
    $mail->Body = $email_body;
    $mail->send();

    send_response(true, 'Your booking request has been submitted successfully. We will contact you soon to confirm your appointment.');
} catch (MailException $e) {
    error_log('cancer-screening-booking.php mail error: ' . $mail->ErrorInfo);
    send_response(false, 'Could not send booking request. Please try again or call +91-7090521000.', 500);
}
