<?php
// Referring Doctor Portal — Patient Referral Handler

define('TO_EMAIL', 'appointments@sschrc.org');
define('FROM_EMAIL', 'noreply@srishankaracancerhospital.org');
define('FROM_NAME', 'Sri Shankara Hospital');
define('EMAIL_SUBJECT', 'New Patient Referral — Referring Doctor Portal');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

function clean_input($data) {
    if (is_array($data)) {
        return array_map('clean_input', $data);
    }
    $data = trim($data);
    $data = stripslashes($data);
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

if (!empty($_POST['website'])) {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Thank you! Your referral has been submitted successfully.']);
    exit;
}

$referring_doctor_name = clean_input($_POST['referring_doctor_name'] ?? '');
$medical_reg_no        = clean_input($_POST['medical_reg_no'] ?? '');
$specialization        = clean_input($_POST['specialization'] ?? '');
$institution_name      = clean_input($_POST['institution_name'] ?? '');
$institution_city      = clean_input($_POST['institution_city'] ?? '');
$doctor_mobile         = clean_input($_POST['doctor_mobile'] ?? '');
$doctor_email          = clean_input($_POST['doctor_email'] ?? '');

$patient_name          = clean_input($_POST['patient_name'] ?? '');
$patient_age           = clean_input($_POST['patient_age'] ?? '');
$patient_gender        = clean_input($_POST['patient_gender'] ?? '');
$patient_mobile        = clean_input($_POST['patient_mobile'] ?? '');
$diagnosis             = clean_input($_POST['diagnosis'] ?? '');

$urgency               = clean_input($_POST['urgency'] ?? '');
$preferred_specialty   = clean_input($_POST['preferred_specialty'] ?? '');
$referralDoctor        = clean_input($_POST['referralDoctor'] ?? '');
$referral_preferred_date = clean_input($_POST['referral_preferred_date'] ?? '');
$referral_preferred_date_formatted = clean_input($_POST['referral_preferred_date_formatted'] ?? '');
$clinical_summary      = clean_input($_POST['clinical_summary'] ?? '');
$referral_consent      = !empty($_POST['referral_consent']);

$errors = [];

if ($referring_doctor_name === '') $errors[] = 'Referring doctor name is required';
if ($medical_reg_no === '') $errors[] = 'Medical registration number is required';
if ($specialization === '') $errors[] = 'Specialization is required';
if ($institution_name === '') $errors[] = 'Hospital/clinic name is required';
if ($institution_city === '') $errors[] = 'City is required';
if (!preg_match('/^\d{10}$/', $doctor_mobile)) $errors[] = 'Valid 10-digit doctor mobile is required';
if ($doctor_email === '' || !filter_var($doctor_email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid doctor email is required';

if ($patient_name === '') $errors[] = 'Patient name is required';
if ($patient_age === '' || !is_numeric($patient_age) || $patient_age < 0 || $patient_age > 120) $errors[] = 'Valid patient age is required';
if ($patient_gender === '') $errors[] = 'Patient gender is required';
if (!preg_match('/^\d{10}$/', $patient_mobile)) $errors[] = 'Valid 10-digit patient mobile is required';
if ($diagnosis === '') $errors[] = 'Diagnosis is required';

$allowed_urgency = ['Routine', 'Urgent', 'Emergency'];
if (!in_array($urgency, $allowed_urgency, true)) $errors[] = 'Referral urgency is required';

if ($clinical_summary === '') $errors[] = 'Clinical summary is required';
if (!$referral_consent) $errors[] = 'Referral authorization consent is required';

$allowed_ext = ['pdf', 'jpg', 'jpeg', 'png'];
$max_size = 5 * 1024 * 1024;
$upload_note = 'None';

if (!empty($_FILES['referral_reports']['name'][0])) {
    $upload_note = '';
    foreach ($_FILES['referral_reports']['name'] as $i => $name) {
        if ($_FILES['referral_reports']['error'][$i] !== UPLOAD_ERR_OK) continue;
        $size = $_FILES['referral_reports']['size'][$i];
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($size > $max_size) {
            $errors[] = 'File "' . clean_input($name) . '" exceeds 5 MB limit';
        } elseif (!in_array($ext, $allowed_ext, true)) {
            $errors[] = 'File "' . clean_input($name) . '" type not allowed';
        } else {
            $upload_note .= ($upload_note === '' ? '' : ', ') . clean_input($name) . ' (' . round($size / 1024) . ' KB)';
        }
    }
    if ($upload_note === '') $upload_note = 'None (upload errors ignored)';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode(', ', $errors)]);
    exit;
}

$preferred_date_display = $referral_preferred_date_formatted ?: ($referral_preferred_date ?: 'Not specified');

$message_body = "NEW PATIENT REFERRAL — REFERRING DOCTOR PORTAL\n";
$message_body .= "================================================\n\n";
$message_body .= "REFERRING DOCTOR:\n";
$message_body .= "Name              : {$referring_doctor_name}\n";
$message_body .= "Registration No.  : {$medical_reg_no}\n";
$message_body .= "Specialization    : {$specialization}\n";
$message_body .= "Institution       : {$institution_name}\n";
$message_body .= "City              : {$institution_city}\n";
$message_body .= "Mobile            : {$doctor_mobile}\n";
$message_body .= "Email             : {$doctor_email}\n\n";
$message_body .= "PATIENT:\n";
$message_body .= "Name              : {$patient_name}\n";
$message_body .= "Age               : {$patient_age}\n";
$message_body .= "Gender            : {$patient_gender}\n";
$message_body .= "Mobile            : {$patient_mobile}\n";
$message_body .= "Diagnosis         : {$diagnosis}\n\n";
$message_body .= "REFERRAL DETAILS:\n";
$message_body .= "Urgency           : {$urgency}\n";
$message_body .= "Preferred Specialty : " . ($preferred_specialty ?: 'Not specified') . "\n";
$message_body .= "Preferred Consultant: " . ($referralDoctor ?: 'Not specified') . "\n";
$message_body .= "Preferred Date    : {$preferred_date_display}\n";
$message_body .= "Reports Uploaded  : {$upload_note}\n\n";
$message_body .= "Clinical Summary:\n{$clinical_summary}\n\n";
$message_body .= "================================================\n";
$message_body .= "Submitted         : " . date('Y-m-d H:i:s') . "\n";
$message_body .= "IP Address        : " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . $doctor_email;
$headers[] = 'Return-Path: ' . FROM_EMAIL;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'X-Priority: ' . ($urgency === 'Emergency' ? '1' : ($urgency === 'Urgent' ? '2' : '3'));

if (isset($_SERVER['SERVER_NAME'])) {
    $headers[] = 'Message-ID: <' . time() . '.' . md5($doctor_mobile . $patient_name) . '@' . $_SERVER['SERVER_NAME'] . '>';
}

$mail_sent = @mail(TO_EMAIL, EMAIL_SUBJECT . ' [' . $urgency . ']', $message_body, implode("\r\n", $headers));

if ($mail_sent) {
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your patient referral has been submitted. Our referral desk will contact you at ' . $doctor_mobile . ' shortly.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send referral. Please try again or call +91-7090521000.'
    ]);
}
exit;
