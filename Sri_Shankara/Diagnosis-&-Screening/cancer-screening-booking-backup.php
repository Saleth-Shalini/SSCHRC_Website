<?php
// Cancer Screening Package Booking Script - BACKUP VERSION
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

$config = require __DIR__ . '/config.php';

$recipient = "appointments@sschrc.org";
$subject   = "New Cancer Screening Package Booking - Sri Shankara Cancer Hospital";

function clean_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function safe_string($str) {
    return preg_replace('/[\r\n]+/', ' ', $str);
}

if (!empty($_POST['website'] ?? '')) {
    http_response_code(400);
    exit("Bad Request");
}

$patientName = clean_input($_POST['patientName'] ?? '');
$patientPhone = clean_input($_POST['patientPhone'] ?? '');
$patientEmail = !empty($_POST['patientEmail']) ? filter_var($_POST['patientEmail'], FILTER_VALIDATE_EMAIL) : '';
$patientAge = clean_input($_POST['patientAge'] ?? '');
$patientGender = clean_input($_POST['patientGender'] ?? '');
$appointmentDate = clean_input($_POST['appointmentDate'] ?? '');
$specialInstructions = clean_input($_POST['specialInstructions'] ?? '');
$packageName = clean_input($_POST['packageName'] ?? '');

$errors = [];
if ($patientName === '' || strlen($patientName) < 2) $errors[] = "Invalid patient name.";
if (!preg_match('/^\d{10}$/', preg_replace('/\D/', '', $patientPhone))) $errors[] = "Valid 10-digit phone number is required.";
// Email is optional, but if provided must be valid
if (!empty($_POST['patientEmail']) && !$patientEmail) $errors[] = "Invalid email address.";
if ($patientAge === '' || !is_numeric($patientAge) || $patientAge < 1 || $patientAge > 120) $errors[] = "Valid age (1-120) is required.";
if (!in_array(strtolower($patientGender), ['male', 'female', 'other'])) $errors[] = "Gender selection is required.";
if ($appointmentDate === '') $errors[] = "Appointment date is required.";
if ($packageName === '') $errors[] = "Package selection is required.";

if (!empty($errors)) {
    http_response_code(400);
    echo "Error: " . implode(" | ", $errors);
    exit;
}

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

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['sschrc']['gmail_user'];
    $mail->Password   = $config['sschrc']['gmail_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    $mail->setFrom('appointments@sschrc.org', 'Sri Shankara Cancer Hospital');
    $mail->addAddress($recipient);

    if ($patientEmail) {
        $mail->addReplyTo($patientEmail, $patientName);
    }

    $mail->isHTML(false);
    $mail->Subject = safe_string($subject);
    $mail->Body    = $body;

    $mail->send();
    echo "SUCCESS: Thank you for your booking request. We will contact you soon to confirm your appointment!";
} catch (Exception $e) {
    http_response_code(500);
    error_log("Mailer Error: " . $mail->ErrorInfo);
    echo "ERROR: Could not send booking request. Please try again later.";
}
?>

