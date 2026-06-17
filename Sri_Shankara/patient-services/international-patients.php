<?php
// ============================================================================
// International Patients Form Handler - GoDaddy Compatible
// File: international-patients.php
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
// EXTRACT & SANITIZE ALL FORM FIELDS
// ============================================================================
$source_page = isset($_POST['source_page']) ? trim(htmlspecialchars($_POST['source_page'], ENT_QUOTES, 'UTF-8')) : 'International Second Opinion';
$full_name = isset($_POST['full-name']) ? trim(htmlspecialchars($_POST['full-name'], ENT_QUOTES, 'UTF-8')) : '';
$age = isset($_POST['age']) ? trim(htmlspecialchars($_POST['age'], ENT_QUOTES, 'UTF-8')) : '';
$mobile = isset($_POST['mobile']) ? trim(htmlspecialchars($_POST['mobile'], ENT_QUOTES, 'UTF-8')) : '';
$email = isset($_POST['email']) ? trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8')) : '';
$gender = isset($_POST['gender']) ? trim(htmlspecialchars($_POST['gender'], ENT_QUOTES, 'UTF-8')) : '';
$country = isset($_POST['country']) ? trim(htmlspecialchars($_POST['country'], ENT_QUOTES, 'UTF-8')) : '';
$symptoms = isset($_POST['symptoms']) ? trim(htmlspecialchars($_POST['symptoms'], ENT_QUOTES, 'UTF-8')) : '';
$questions = isset($_POST['questions']) ? trim(htmlspecialchars($_POST['questions'], ENT_QUOTES, 'UTF-8')) : '';

// Checkboxes
$confirm_accuracy = isset($_POST['confirm-accuracy']) ? 'Yes' : 'No';
$preliminary_opinion = isset($_POST['preliminary-opinion']) ? 'Yes' : 'No';
$consent = isset($_POST['consent']) ? 'Yes' : 'No';

// ============================================================================
// VALIDATION
// ============================================================================
$errors = [];

if (empty($full_name)) $errors[] = 'Full Name is required';
if (empty($age) || !is_numeric($age) || $age < 1 || $age > 120) $errors[] = 'Valid Age (1-120) is required';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid Email is required';
if (empty($gender)) $errors[] = 'Gender is required';
if (empty($country)) $errors[] = 'Country of Residence is required';
if ($confirm_accuracy !== 'Yes') $errors[] = 'Please confirm the accuracy of your information';
if ($preliminary_opinion !== 'Yes') $errors[] = 'Please acknowledge that this is a preliminary opinion';
if ($consent !== 'Yes') $errors[] = 'Consent is required';

// Validate mobile if provided
if (!empty($mobile) && !preg_match('/^\+?[0-9\s\-]{7,15}$/', $mobile)) {
    $errors[] = 'Invalid mobile number format';
}

// If validation fails
if (!empty($errors)) {
    $response['message'] = implode(', ', $errors);
    echo json_encode($response);
    exit;
}

// ============================================================================
// HANDLE FILE UPLOADS (reports[])
// ============================================================================
$uploaded_files = [];
$upload_errors = [];

if (isset($_FILES['reports']) && !empty($_FILES['reports']['name'][0])) {
    $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'zip'];
    $max_file_size = 20 * 1024 * 1024; // 20 MB total
    $total_size = 0;
    
    $total_files = count($_FILES['reports']['name']);
    
    for ($i = 0; $i < $total_files; $i++) {
        if ($_FILES['reports']['error'][$i] === UPLOAD_ERR_OK) {
            $file_name = $_FILES['reports']['name'][$i];
            $file_size = $_FILES['reports']['size'][$i];
            $file_tmp = $_FILES['reports']['tmp_name'][$i];
            
            // Check total size
            $total_size += $file_size;
            if ($total_size > $max_file_size) {
                $upload_errors[] = "Total file size exceeds 20MB";
                break;
            }
            
            // Get file extension
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            
            // Validate extension
            if (!in_array($file_ext, $allowed_extensions)) {
                $upload_errors[] = "File '$file_name' has invalid extension";
                continue;
            }
            
            // Read file content and encode
            $file_content = file_get_contents($file_tmp);
            $file_encoded = chunk_split(base64_encode($file_content));
            
            $uploaded_files[] = [
                'name' => $file_name,
                'content' => $file_encoded,
                'type' => $_FILES['reports']['type'][$i]
            ];
        }
    }
}

// ============================================================================
// PREPARE EMAIL CONTENT
// ============================================================================
$to = 'appointments@sschrc.org';
$subject_base = 'International Patient Request - ' . $source_page;
$subject = $subject_base . ' - #' . date('YmdHis') . '-' . substr(uniqid(), -4);
$from = 'noreply@srishankaracancerhospital.org';

// Email body in plain text
$message_body = "NEW INTERNATIONAL PATIENT REQUEST\n";
$message_body .= "================================\n\n";
$message_body .= "Source Page: $source_page\n";
$message_body .= "Submission Date/Time: " . date('d-M-Y h:i A') . "\n\n";
$message_body .= "PATIENT INFORMATION:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Full Name: $full_name\n";
$message_body .= "Age: $age\n";
$message_body .= "Phone Number: " . (!empty($mobile) ? $mobile : 'Not provided') . "\n";
$message_body .= "Email: $email\n";
$message_body .= "Gender: $gender\n";
$message_body .= "Country of Residence: $country\n\n";
$message_body .= "MEDICAL DETAILS:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Current Symptoms/Complaints: " . (!empty($symptoms) ? $symptoms : 'Not provided') . "\n\n";
$message_body .= "Questions: " . (!empty($questions) ? $questions : 'None') . "\n\n";
$message_body .= "CONSENT & CONFIRMATIONS:\n";
$message_body .= "-----------------------------------\n";
$message_body .= "Confirm Accuracy: $confirm_accuracy\n";
$message_body .= "Preliminary Opinion Understood: $preliminary_opinion\n";
$message_body .= "Consent to Use Medical Info: $consent\n\n";

if (!empty($uploaded_files)) {
    $message_body .= "Medical Reports: " . count($uploaded_files) . " file(s) attached\n\n";
} else {
    $message_body .= "Medical Reports: No files uploaded\n\n";
}

$message_body .= "================================\n";
$message_body .= "This is an automated message from International Patients Form\n";

// ============================================================================
// SEND EMAIL WITH ATTACHMENTS
// ============================================================================

// Generate truly unique boundary
$boundary = '----=_Part_' . uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . time();

// Generate unique Message-ID
$message_id = '<' . time() . '.' . uniqid() . '.' . bin2hex(random_bytes(8)) . '@srishankaracancerhospital.org>';
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
    $response['message'] = 'Your request has been submitted successfully. Our international patient care team will contact you soon.';
} else {
    $response['message'] = 'Failed to send email. Please try again or contact us directly at +91-7090521000';
}

// Clear output buffer and send response
ob_end_clean();
echo json_encode($response);
exit;
?>

