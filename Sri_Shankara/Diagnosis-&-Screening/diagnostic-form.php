<?php
// --------------------
// ERROR REPORTING (disable in production)
// --------------------
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't show errors to users
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// --------------------
// VALIDATE REQUEST METHOD
// --------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed.'
    ]);
    exit;
}

// --------------------
// LOAD PHPMailer
// --------------------
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

// --------------------
// LOAD CONFIG
// --------------------
// Try multiple possible config locations
$possibleConfigPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../patient-services/config.php',
    $_SERVER['DOCUMENT_ROOT'] . '/../secure/config.php'
];

$config = null;
$configPath = null;

foreach ($possibleConfigPaths as $path) {
    if (file_exists($path)) {
        $configPath = $path;
        $configData = require $path;
        // Handle both array format and nested array format
        if (isset($configData['sschrc'])) {
            $config = $configData['sschrc'];
        } else {
            $config = $configData;
        }
        break;
    }
}

if (!$config) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Configuration file not found.'
    ]);
    error_log("Config file not found. Tried: " . implode(", ", $possibleConfigPaths));
    exit;
}

// --------------------
// CONFIGURATION
// --------------------
$recipient = "appointments@sschrc.org";
$subject   = "New Diagnostic Test Request - Sri Shankara Cancer Hospital";


// --------------------
// SECURITY HELPERS
// --------------------
function clean_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function safe_string($str) {
    return preg_replace('/[\r\n]+/', ' ', $str);
}

// --------------------
// HONEYPOT (spam trap)
// --------------------
if (!empty($_POST['website'] ?? '')) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Bad Request'
    ]);
    exit;
}

// --------------------
// COLLECT FIELDS
// --------------------
$fullName       = clean_input($_POST['fullName'] ?? '');
$contact        = preg_replace('/\D/', '', $_POST['contact'] ?? '');
$email          = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$age            = intval($_POST['age'] ?? 0);
$gender         = clean_input($_POST['gender'] ?? '');
$medicalHistory = clean_input($_POST['medicalHistory'] ?? '');
$consent        = isset($_POST['consent']) ? true : false;

// --------------------
// VALIDATION
// --------------------
$errors = [];
if ($fullName === '' || strlen($fullName) < 2) $errors[] = "Invalid full name.";
if (!preg_match('/^\d{10}$/', $contact)) $errors[] = "Contact number must be 10 digits.";
if (!$email) $errors[] = "Valid email is required.";
if ($age < 1 || $age > 120) $errors[] = "Invalid age (must be between 1 and 120).";
if (!$consent) $errors[] = "Consent is required.";

if (!empty($errors)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => implode(" | ", $errors)
    ]);
    exit;
}



// --------------------
// Upload Govt. ID Proof
// --------------------
$idProofPath = null;

if (isset($_FILES['idProof']) && $_FILES['idProof']['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $fileTmpPath = $_FILES['idProof']['tmp_name'];
    $fileName = basename($_FILES['idProof']['name']);

    // Detect file MIME type using finfo (more reliable than mime_content_type)
    $finfo     = finfo_open(FILEINFO_MIME_TYPE);
    $fileType  = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);

    // File size check (max 5MB)
    if ($_FILES['idProof']['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Govt. ID Proof file is too large (max 5MB allowed).'
        ]);
        exit;
    }
    
    if (in_array($fileType, $allowedTypes)) {
        $uploadDir = __DIR__ . "/uploads/idproofs/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Safer filename (timestamp + uniqid)
        $uniquePrefix = uniqid(time() . "_", true);
        $safeFileName = preg_replace("/[^a-zA-Z0-9._-]/", "_", $fileName);
        $destPath     = $uploadDir . $uniquePrefix . "_" . $safeFileName;
        
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            // Restrict file permissions
            chmod($destPath, 0640);
            $idProofPath = $destPath;
        } else {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to upload Govt. ID Proof. Please try again.'
            ]);
            exit;
        }
    } else {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid file type for Govt. ID Proof. Allowed: JPG, JPEG, PNG, GIF, WEBP.'
        ]);
        exit;
    }
} else {
    // Check if file upload error occurred
    if (isset($_FILES['idProof'])) {
        $error = $_FILES['idProof']['error'];
        if ($error !== UPLOAD_ERR_OK) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'error',
                'message' => 'Govt. ID Proof upload failed. Please try again.'
            ]);
            exit;
        }
    }
    // If no file was uploaded at all, it's required
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Govt. ID Proof is required.'
    ]);
    exit;
}



// --------------------
// BUILD EMAIL BODY
// --------------------
$body  = "New Diagnostic Test Request\n";
$body .= "--------------------------------\n";
$body .= "Full Name       : " . safe_string($fullName) . "\n";
$body .= "Contact Number  : " . $contact . "\n";
$body .= "Email           : " . safe_string($email) . "\n";
$body .= "Age             : " . $age . "\n";
$body .= "Gender          : " . ($gender ?: "Not specified") . "\n";
$body .= "Medical History : " . ($medicalHistory ?: "N/A") . "\n";
$body .= "--------------------------------\n";
$body .= "Submitted on: " . date("d-m-Y H:i:s") . "\n";

// --------------------
// SEND EMAIL VIA SMTP (PHPMailer)
// --------------------
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['gmail_user'];   
    $mail->Password   = $config['gmail_pass'];       
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->SMTPDebug  = 0; // Set to 2 for debugging
    $mail->Debugoutput = 'error_log';

    // Recipients
    $mail->setFrom('appointments@sschrc.org', 'Sri Shankara Cancer Hospital');
    $mail->addAddress($recipient);
    if ($email) {    // only add if valid
    $mail->addReplyTo($email, $fullName);
    }
    // Attach uploaded documents 

// --------------------
// Upload Medical Reports (store on server, send links in email)
// --------------------
$reportLinks = [];

if (!empty($_FILES['documents']['name'][0])) {
    $uploadDir = __DIR__ . "/uploads/diagnostic_docs/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    
$allowedDocs = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
$maxSize = 10 * 1024 * 1024; // 10 MB

foreach ($_FILES['documents']['tmp_name'] as $key => $tmp_name) {
    if (is_uploaded_file($tmp_name)) {
        // Reliable MIME check
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $docType = finfo_file($finfo, $tmp_name);
        finfo_close($finfo);

        $docSize = $_FILES['documents']['size'][$key];

        if ($docSize > $maxSize || !in_array($docType, $allowedDocs)) {
            continue; // skip invalid files
        }

        // Unique + safe filename
        $filename = time() . "_" . uniqid() . "_" .
                    preg_replace("/[^a-zA-Z0-9._-]/", "_", $_FILES['documents']['name'][$key]);

        $destPath = $uploadDir . $filename;

        if (move_uploaded_file($tmp_name, $destPath)) {
            $mail->addAttachment($destPath, $filename);
            $reportLinks[] = "https://yourdomain.com/uploads/diagnostic_docs/" . $filename;
        }
    }
}

}

// Add links to email body
if (!empty($reportLinks)) {
    $body .= "\nMedical Reports:\n" . implode("\n", $reportLinks) . "\n";
} else {
    $body .= "\nMedical Reports: None uploaded\n";
}

   
   // Add Govt. ID Proof info
if ($idProofPath && file_exists($idProofPath) && is_file($idProofPath)) {
    $mail->addAttachment($idProofPath, basename($idProofPath));
    $body .= "Govt. ID Proof  : Attached (" . basename($idProofPath) . ")\n";
} else {
    $body .= "Govt. ID Proof  : " . $idProofPath . "\n";
}

    // Content
    $mail->isHTML(false);
    $mail->Subject = safe_string($subject);
    $mail->Body    = $body;

    $mail->send();
    
    // Return JSON response for AJAX handling
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Diagnostic request submitted successfully! We will contact you soon.'
    ]);
    exit;
} catch (Exception $e) {
    error_log("PHPMailer Error: " . $mail->ErrorInfo);
    error_log("Exception: " . $e->getMessage());
    
    // Return JSON response for AJAX handling
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Could not send email. Please try again later or contact us directly.'
    ]);
    exit;
}

