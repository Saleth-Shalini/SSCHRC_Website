<?php
// Cancer Screening Booking Form Handler
// Compatible with GoDaddy cPanel Hosting (PHP 7.4+)
// Last Updated: 2026

// Prevent direct access without POST data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('ERROR: Invalid request method. This file must be accessed via POST.');
}

// Configuration
$recipient_email = 'appointments@sschrc.org';
$email_subject = 'New Cancer-Screening-Packages Lead';
$from_email = 'noreply@srishankaracancerhospital.org'; // Change to your actual domain email
$reply_to_email = '';

// Function to sanitize input
function sanitize_input($data) {
    if ($data === null || $data === '') {
        return '';
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Extract and sanitize ALL form fields (matching exact JavaScript field names)
$packageName = sanitize_input($_POST['packageName'] ?? '');
$patientName = sanitize_input($_POST['patientName'] ?? '');
$patientPhone = sanitize_input($_POST['patientPhone'] ?? '');
$patientEmail = sanitize_input($_POST['patientEmail'] ?? '');
$patientAge = sanitize_input($_POST['patientAge'] ?? '');
$patientGender = sanitize_input($_POST['patientGender'] ?? '');
$appointmentDate = sanitize_input($_POST['appointmentDate'] ?? '');
$specialInstructions = sanitize_input($_POST['specialInstructions'] ?? '');

// Validation: Check required fields
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
    if (empty($field_value)) {
        $missing_fields[] = $field_name;
    }
}

if (!empty($missing_fields)) {
    die('ERROR: Missing required fields: ' . implode(', ', $missing_fields));
}

// Additional validation
if (!empty($patientEmail) && !filter_var($patientEmail, FILTER_VALIDATE_EMAIL)) {
    die('ERROR: Invalid email address format.');
}

if (!is_numeric($patientAge) || $patientAge < 1 || $patientAge > 120) {
    die('ERROR: Invalid age. Must be between 1 and 120.');
}

// Set Reply-To to patient email if provided
if (!empty($patientEmail)) {
    $reply_to_email = $patientEmail;
} else {
    $reply_to_email = $from_email;
}

// 🔒 Final safety check (ADD THIS HERE)
$reply_to_email = filter_var($reply_to_email, FILTER_VALIDATE_EMAIL)
    ? $reply_to_email
    : $from_email;




// Safe appointment date handling
$formatted_date = '';
if (!empty($appointmentDate) && strtotime($appointmentDate)) {
    $formatted_date = date('F j, Y', strtotime($appointmentDate));
} else {
    $formatted_date = $appointmentDate ?: 'Not provided';
}

// Safe user agent handling
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';



// Build email body
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
$email_body .= "Preferred Date: " . $formatted_date . " (" . ($appointmentDate ?: 'Not provided') . ")\n\n";


if (!empty($specialInstructions)) {
    $email_body .= "SPECIAL INSTRUCTIONS:\n";
    $email_body .= "-------------------------------------------\n";
    $email_body .= $specialInstructions . "\n\n";
}

$email_body .= "==============================================\n";
$email_body .= "Submitted on: " . date('F j, Y g:i A') . "\n";
$email_body .= "IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";

$email_body .= "User Agent: " . $user_agent . "\n";

$email_body .= "==============================================\n";

// Email headers (GoDaddy compatible)
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Sri Shankara Cancer Hospital <' . $from_email . '>';
$headers[] = 'Reply-To: ' . $reply_to_email;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'X-Priority: 1'; // High priority
$headers[] = 'Importance: High';

// Convert headers array to string
$headers_string = implode("\r\n", $headers);

// Send email using PHP mail() function
$mail_sent = mail($recipient_email, $email_subject, $email_body, $headers_string);

// Return response
if ($mail_sent) {
    echo 'SUCCESS: Your booking request has been submitted successfully. We will contact you soon to confirm your appointment.';
} else {
    echo 'ERROR: Failed to send email. Please try again later or contact us directly at ' . $recipient_email;
}

// Optional: Log to file (for debugging - remove in production)
// $log_file = __DIR__ . '/booking_logs.txt';
// $log_entry = date('Y-m-d H:i:s') . " | $patientName | $patientPhone | $packageName | Status: " . ($mail_sent ? 'SUCCESS' : 'FAILED') . "\n";
// file_put_contents($log_file, $log_entry, FILE_APPEND);

exit;
?>

