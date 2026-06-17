<?php
// donate.php - Sri Shankara Cancer Hospital Donation Receipt Form Handler
// Compatible with GoDaddy cPanel shared hosting
// FIXED VERSION - Proper AJAX support + File upload handling

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
// Matching exact "name" attributes from Donate.html

$donor_name = isset($_POST['donor_name']) ? trim($_POST['donor_name']) : '';
$program = isset($_POST['program']) ? trim($_POST['program']) : '';
$amount = isset($_POST['amount']) ? trim($_POST['amount']) : '';
$pan = isset($_POST['pan']) ? trim($_POST['pan']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$contact = isset($_POST['contact']) ? trim($_POST['contact']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$transaction_id = isset($_POST['transaction_id']) ? trim($_POST['transaction_id']) : '';
$consent = isset($_POST['consent']) ? 'Yes' : 'No';

// ============================================
// VALIDATION: CHECK REQUIRED FIELDS
// ============================================
$required_fields = array(
    'donor_name' => $donor_name,
    'program' => $program,
    'amount' => $amount,
    'pan' => $pan,
    'email' => $email,
    'contact' => $contact,
    'address' => $address,
    'transaction_id' => $transaction_id
);

$missing_fields = array();
foreach ($required_fields as $field => $value) {
    if (empty($value)) {
        $missing_fields[] = ucfirst(str_replace('_', ' ', $field));
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
// VALIDATE PAN FORMAT (Basic validation)
// ============================================
if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', strtoupper($pan))) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Please enter a valid PAN number (Format: AAAAA0000A)'
    ));
    exit;
}

// ============================================
// VALIDATE DONOR NAME
// ============================================
if (!preg_match('/^[A-Za-z\s]{3,50}$/', $donor_name)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Donor name must be 3–50 characters and contain only alphabets and spaces.'
    ));
    exit;
}

// ============================================
// VALIDATE CONTACT NUMBER (exactly 10 digits)
// ============================================
if (!preg_match('/^\d{10}$/', $contact)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Contact Number must be exactly 10 digits (numbers only).'
    ));
    exit;
}

// ============================================
// VALIDATE DONATION AMOUNT (positive number)
// ============================================
if (!is_numeric($amount) || intval($amount) <= 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Donation amount must be a number greater than 0.'
    ));
    exit;
}

// ============================================
// VALIDATE ADDRESS (not only whitespace)
// ============================================
if (strlen(trim($address)) === 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Address is required and cannot be blank.'
    ));
    exit;
}

// ============================================
// VALIDATE UTR/TRANSACTION ID (alphanumeric, 6–30 chars)
// ============================================
if (!preg_match('/^[A-Za-z0-9]{6,30}$/', $transaction_id)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array(
        'status' => 'error',
        'message' => 'UTR/Transaction ID must be 6–30 alphanumeric characters (no spaces or special characters).'
    ));
    exit;
}

// ============================================
// HANDLE FILE UPLOAD (Payment Proof)
// ============================================
$upload_info = '';
$file_attached = false;

if (isset($_FILES['payment_proof']) && $_FILES['payment_proof']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['payment_proof'];
    
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Error uploading file. Please try again.'
        ));
        exit;
    }
    
    // Validate file size (max 5MB)
    $max_size = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $max_size) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(array(
            'status' => 'error',
            'message' => 'File size too large. Maximum 5MB allowed.'
        ));
        exit;
    }
    
    // Validate file type
    $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf');
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.'
        ));
        exit;
    }
    
    // Create uploads directory if it doesn't exist
    $upload_dir = __DIR__ . '/uploads/donation_proofs/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    // Generate unique filename
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $new_filename = 'donation_' . time() . '_' . uniqid() . '.' . $file_extension;
    $upload_path = $upload_dir . $new_filename;
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $upload_path)) {
        $upload_info = "Payment Proof: " . $new_filename . " (Uploaded successfully)\n";
        $upload_info .= "File Size: " . number_format($file['size'] / 1024, 2) . " KB\n";
        $upload_info .= "File Location: " . $upload_path . "\n";
        $file_attached = true;
    } else {
        $upload_info = "Payment Proof Upload Failed\n";
    }
}

// ============================================
// SANITIZE ALL INPUTS
// ============================================
$donor_name = htmlspecialchars($donor_name, ENT_QUOTES, 'UTF-8');
$program = htmlspecialchars($program, ENT_QUOTES, 'UTF-8');
$amount = htmlspecialchars($amount, ENT_QUOTES, 'UTF-8');
$pan = strtoupper(htmlspecialchars($pan, ENT_QUOTES, 'UTF-8'));
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$contact = htmlspecialchars($contact, ENT_QUOTES, 'UTF-8');
$address = htmlspecialchars($address, ENT_QUOTES, 'UTF-8');
$transaction_id = htmlspecialchars($transaction_id, ENT_QUOTES, 'UTF-8');

// ============================================
// EMAIL CONFIGURATION
// ============================================
$to_email = 'appointments@sschrc.org';
$subject = 'New Donation Receipt Request - ' . $donor_name . ' - ' . date('Y-m-d');
// From header removed - GoDaddy root uses its own server address

// ============================================
// EMAIL BODY - ALL FIELDS LISTED
// ============================================
$email_body = "==================================================\n";
$email_body .= "NEW DONATION RECEIPT REQUEST\n";
$email_body .= "==================================================\n\n";
$email_body .= "Date & Time: " . date('Y-m-d H:i:s') . "\n\n";
$email_body .= "DONOR DETAILS:\n";
$email_body .= "-------------------\n";
$email_body .= "Name of the Donor: " . $donor_name . "\n";
$email_body .= "Program Donated Toward: " . $program . "\n";
$email_body .= "Amount Donated (INR): ₹" . number_format($amount, 2) . "\n";
$email_body .= "PAN Number: " . $pan . "\n";
$email_body .= "Email Address: " . $email . "\n";
$email_body .= "Contact Number: " . $contact . "\n";
$email_body .= "Address: " . $address . "\n";
$email_body .= "UTR/Transaction ID: " . $transaction_id . "\n";
$email_body .= "Consent to Receive Updates: " . $consent . "\n\n";

if ($file_attached) {
    $email_body .= "PAYMENT PROOF:\n";
    $email_body .= "-------------------\n";
    $email_body .= $upload_info . "\n";
}

$email_body .= "==================================================\n";
$email_body .= "Source: Donation Page (Donate.html)\n";
$email_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "==================================================\n";

// ============================================
// EMAIL CONFIGURATION - GoDaddy Root Domain Fix
// ============================================
// TEST RESULT: GoDaddy root sends FROM its own server address:
// az5v0bah4rbd@sg2plzcpnl509378.prod.sin2.secureserver.net
// We cannot override this with a custom From: on root domain.
// Solution: Remove custom From: header entirely. Add Reply-To
// so staff can reply to donor. Add proper headers to avoid spam.
// ============================================

$headers  = "Reply-To: " . $donor_name . " <" . $email . ">\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// ============================================
// SEND EMAIL
// ============================================
$mail_sent = @mail($to_email, $subject, $email_body, $headers);

// ============================================
// RESPONSE HANDLING - Always return JSON
// ============================================
header('Content-Type: application/json; charset=utf-8');

if ($mail_sent) {
    http_response_code(200);
    echo json_encode(array(
        'status' => 'success',
        'message' => 'Thank you! Your donation receipt request has been submitted successfully. We will process your request and send the receipt to your email address shortly.'
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'An error occurred while submitting your request. Please try again later or contact us directly at appointments@sschrc.org'
    ));
}
exit;
?>

