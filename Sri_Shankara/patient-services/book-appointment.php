<?php
ob_start();
date_default_timezone_set('Asia/Kolkata');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

function send_json($status, $message, $code = 200) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['status' => $status, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('error', 'Invalid request method.', 405);
}

function clean_input($data) {
    if (is_array($data)) {
        return array_map('clean_input', $data);
    }
    return htmlspecialchars(trim(stripslashes($data)), ENT_QUOTES, 'UTF-8');
}

if (!empty($_POST['website'])) {
    send_json('success', 'Thank you! Your appointment request has been submitted successfully.');
}

$full_name = isset($_POST['full_name']) ? clean_input($_POST['full_name']) : '';
$age = isset($_POST['age']) ? clean_input($_POST['age']) : '';
$mobile = isset($_POST['mobile']) ? clean_input($_POST['mobile']) : '';
$email = isset($_POST['email']) ? clean_input($_POST['email']) : '';
$gender = isset($_POST['gender']) ? clean_input($_POST['gender']) : '';
$preferred_date = isset($_POST['preferred_date']) ? clean_input($_POST['preferred_date']) : '';
$preferred_date_formatted = isset($_POST['preferred_date_formatted']) ? clean_input($_POST['preferred_date_formatted']) : '';
$selectedDoctor = isset($_POST['selectedDoctor']) ? clean_input($_POST['selectedDoctor']) : '';
$notes = isset($_POST['notes']) ? clean_input($_POST['notes']) : '';

$errors = [];

if (empty($full_name)) {
    $errors[] = 'Full name is required';
}
if (empty($age) || !is_numeric($age) || $age < 0 || $age > 120) {
    $errors[] = 'Valid age is required (0-120)';
}
if (empty($mobile) || !preg_match('/^\d{10}$/', $mobile)) {
    $errors[] = 'Valid 10-digit mobile number is required';
} elseif (!preg_match('/^[6-9]/', $mobile)) {
    $errors[] = 'Mobile number cannot start with 1, 2, 3, 4, or 5. Please enter a valid 10-digit Indian mobile number.';
}
if (empty($gender)) {
    $errors[] = 'Gender is required';
}
if (empty($preferred_date)) {
    $errors[] = 'Preferred date is required';
} elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $preferred_date)) {
    $errors[] = 'Invalid preferred date';
} else {
    $selected_date = DateTime::createFromFormat('Y-m-d', $preferred_date);
    $today_date = new DateTime('today');
    $max_date = (clone $today_date)->modify('+1 year');
    if (!$selected_date || $selected_date < $today_date || $selected_date > $max_date) {
        $errors[] = 'Preferred date must be between today and one year from today.';
    }
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (!empty($errors)) {
    send_json('error', implode(', ', $errors), 400);
}

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
$message_body .= "IP Address : " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";

$live_path = '/home/az5v0bah4rbd/email_credentials.php';
$local_path = __DIR__ . '/../email_credentials.php';
$creds_file = file_exists($live_path) ? $live_path : $local_path;

if (!file_exists($creds_file)) {
    error_log('book-appointment.php: email credentials file not found');
    send_json('error', 'Could not send appointment request. Please try again or call +91-7090521000.', 500);
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
    if (!empty($email)) {
        $mail->addReplyTo($email, $full_name);
    }

    $mail->isHTML(false);
    $mail->Subject = 'New Book Appointment Lead';
    $mail->Body = $message_body;
    $mail->send();

    send_json('success', 'Thank you! Your appointment request has been submitted successfully. We will contact you shortly at ' . $mobile . '.');
} catch (MailException $e) {
    error_log('book-appointment.php mail error: ' . $mail->ErrorInfo);
    send_json('error', 'Could not send appointment request. Please try again or call +91-7090521000.', 500);
}
