<?php
// ============================================================================
// Second Opinion Form Handler - GoDaddy Compatible
// File: second-opinion.php
// Email: appointments@sschrc.org
// ============================================================================

// Security: Start output buffering
ob_start();

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Response header for JSON
header('Content-Type: application/json');

// Initialize response
$response = [
    'status' => 'error',
    'message' => 'An error occurred'
];

// Check if form was submitted via POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit;
}

// ============================================================================
// HONEYPOT CHECK (Anti-spam)
// ============================================================================
if (!empty($_POST['website'])) {
    $response['message'] = 'Spam detected';
    echo json_encode($response);
    exit;
}

// ============================================================================
// EXTRACT & SANITIZE ALL FORM FIELDS
// ============================================================================
$full_name = isset($_POST['full_name']) ? trim(htmlspecialchars($_POST['full_name'], ENT_QUOTES, 'UTF-8')) : '';
$age = isset($_POST['age']) ? trim(htmlspecialchars($_POST['age'], ENT_QUOTES, 'UTF-8')) : '';
$mobile = isset($_POST['mobile']) ? trim(htmlspecialchars($_POST['mobile'], ENT_QUOTES, 'UTF-8')) : '';
$email = isset($_POST['email']) ? trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8')) : '';
$patient_name = isset($_POST['patient_name']) ? trim(htmlspecialchars($_POST['patient_name'], ENT_QUOTES, 'UTF-8')) : '';
$country = isset($_POST['country']) ? trim(htmlspecialchars($_POST['country'], ENT_QUOTES, 'UTF-8')) : '';
$other_country = isset($_POST['other_country']) ? trim(htmlspecialchars($_POST['other_country'], ENT_QUOTES, 'UTF-8')) : '';
$diagnosis = isset($_POST['diagnosis']) ? trim(htmlspecialchars($_POST['diagnosis'], ENT_QUOTES, 'UTF-8')) : '';
$symptoms = isset($_POST['symptoms']) ? trim(htmlspecialchars($_POST['symptoms'], ENT_QUOTES, 'UTF-8')) : '';
$consent = isset($_POST['consent']) ? 'Yes' : 'No';

// ============================================================================
// VALIDATION
// ============================================================================
$errors = [];

if (empty($full_name)) $errors[] = 'Full Name is required';
if (empty($age) || !is_numeric($age) || $age < 1 || $age > 120) $errors[] = 'Valid Age is required';
if (empty($mobile)) $errors[] = 'Mobile number is required';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid Email is required';
if (empty($country)) $errors[] = 'Country is required';
if ($country === 'Other' && empty($other_country)) $errors[] = 'Please specify your country';
if ($consent !== 'Yes') $errors[] = 'Consent is required';

// If validation fails
if (!empty($errors)) {
    $response['message'] = implode(', ', $errors);
    echo json_encode($response);
    exit;
}

// ============================================================================
// HANDLE FILE UPLOADS
// ============================================================================
$uploaded_files = [];
$upload_errors = [];

if (isset($_FILES['medical_reports']) && !empty($_FILES['medical_reports']['name'][0])) {
    $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png'];
    $max_file_size = 5 * 1024 * 1024; // 5 MB
    
    $total_files = count($_FILES['medical_reports']['name']);
    
    for ($i = 0; $i < $total_files; $i++) {
        if ($_FILES['medical_reports']['error'][$i] === UPLOAD_ERR_OK) {
            $file_name = $_FILES['medical_reports']['name'][$i];
            $file_size = $_FILES['medical_reports']['size'][$i];
            $file_tmp = $_FILES['medical_reports']['tmp_name'][$i];
            
            // Get file extension
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            
            // Validate extension
            if (!in_array($file_ext, $allowed_extensions)) {
                $upload_errors[] = "File '$file_name' has invalid extension";
                continue;
            }
            
            // Validate size
            if ($file_size > $max_file_size) {
                $upload_errors[] = "File '$file_name' exceeds 5MB";
                continue;
            }
            
            // Read file content and encode
            $file_content = file_get_contents($file_tmp);
            $file_encoded = chunk_split(base64_encode($file_content));
            
            $uploaded_files[] = [
                'name' => $file_name,
                'content' => $file_encoded,
                'type' => $_FILES['medical_reports']['type'][$i]
            ];
        }
    }
}

// ============================================================================
// PREPARE EMAIL CONTENT
// ============================================================================
$to = 'appointments@sschrc.org';
$subject_base = 'Second Opinion Request';
$subject = $subject_base . ' - #' . date('YmdHis') . '-' . substr(uniqid(), -4);
$from = 'noreply@srishankaracancerhospital.org';

// Determine final country value
$final_country = ($country === 'Other' && !empty($other_country)) ? $other_country : $country;

// Email body in plain text
$message_body = "NEW SECOND OPINION REQUEST\n";
$message_body .= "================================\n\n";
$message_body .= "Submission Date/Time: " . date('d-M-Y h:i A') . "\n\n";
$message_body .= "CONTACT INFORMATION:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Full Name: $full_name\n";
$message_body .= "Age: $age\n";
$message_body .= "Mobile: $mobile\n";
$message_body .= "Email: $email\n";
$message_body .= "Patient Name: " . (!empty($patient_name) ? $patient_name : 'Same as contact') . "\n";
$message_body .= "Country: $final_country\n\n";
$message_body .= "MEDICAL DETAILS:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Diagnosis/Condition: " . (!empty($diagnosis) ? $diagnosis : 'Not provided') . "\n";
$message_body .= "Symptoms & History: " . (!empty($symptoms) ? $symptoms : 'Not provided') . "\n\n";
$message_body .= "CONSENT:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Authorization: $consent\n\n";

if (!empty($uploaded_files)) {
    $message_body .= "Medical Reports: " . count($uploaded_files) . " file(s) attached\n\n";
} else {
    $message_body .= "Medical Reports: No files uploaded\n\n";
}

$message_body .= "================================\n";
$message_body .= "This is an automated message from Second Opinion Form\n";

// ============================================================================
// SEND EMAIL WITH ATTACHMENTS (GoDaddy SAFE)
// ============================================================================

// Generate truly unique boundary (safe)
if (function_exists('openssl_random_pseudo_bytes')) {
    $boundary_random = bin2hex(openssl_random_pseudo_bytes(8));
} else {
    $boundary_random = substr(md5(uniqid(mt_rand(), true)), 0, 16);
}
$boundary = '----=_Part_' . uniqid() . '_' . $boundary_random . '.' . time();

// Generate unique Message-ID (safe)
if (function_exists('openssl_random_pseudo_bytes')) {
    $msg_random = bin2hex(openssl_random_pseudo_bytes(8));
} else {
    $msg_random = substr(md5(uniqid(mt_rand(), true)), 0, 16);
}
$message_id = '<' . time() . '.' . uniqid() . '.' . $msg_random . '@srishankaracancerhospital.org>';

$date_header = date('r');


// Headers
$headers = "From: $from\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Date: $date_header\r\n";
$headers .= "Message-ID: $message_id\r\n";
$headers .= "X-Priority: 1\r\n";
$headers .= "Importance: High\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";


// Email body structure
$email_message = "--$boundary\r\n";
$email_message .= "Content-Type: text/plain; charset=UTF-8\r\n";
$email_message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$email_message .= $message_body . "\r\n";

// Attach files if any
foreach ($uploaded_files as $file) {
    $email_message .= "--$boundary\r\n";
    $email_message .= "Content-Type: {$file['type']}; name=\"{$file['name']}\"\r\n";
    $email_message .= "Content-Transfer-Encoding: base64\r\n";
    $email_message .= "Content-Disposition: attachment; filename=\"{$file['name']}\"\r\n\r\n";
    $email_message .= $file['content'] . "\r\n";
}

$email_message .= "--$boundary--";

// Send email
$mail_sent = mail($to, $subject, $email_message, $headers);

// ============================================================================
// RESPONSE
// ============================================================================
if ($mail_sent) {
    $response['status'] = 'success';
    $response['message'] = 'Your second opinion request has been submitted successfully. Our team will contact you soon.';
} else {
    $response['message'] = 'Failed to send email. Please try again or contact us directly at +91-7090521000';
}

// Clear output buffer and send response
ob_end_clean();
echo json_encode($response);
exit;
?>

