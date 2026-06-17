<?php
// =====================================================
// UNIFIED Appointment PHP Handler
// Handles BOTH forms:
// 1. book-appointment.html (Patient Services)
// 2. Cancer-Specialists.html (Doctor Booking)
// Compatible with GoDaddy cPanel Shared Hosting
// =====================================================

// Set JSON response headers
header('Content-Type: application/json');

// Security: Prevent direct access without POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method. Please use the form to submit.'
    ]);
    exit;
}

// =====================================================
// SANITIZATION FUNCTION
// =====================================================
function clean_input($data) {
    if (is_array($data)) {
        return array_map('clean_input', $data);
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// =====================================================
// DETECT WHICH FORM WAS SUBMITTED
// =====================================================
// Form 1: book-appointment.html has 'full_name' field
// Form 2: Cancer-Specialists.html has 'patientName' field
$is_patient_services_form = isset($_POST['full_name']);
$is_cancer_specialists_form = isset($_POST['patientName']);

// =====================================================
// HONEYPOT CHECK (Anti-spam) - Only for Form 1
// =====================================================
if ($is_patient_services_form && !empty($_POST['website'])) {
    // Bot detected - silently fail
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your appointment request has been submitted successfully.'
    ]);
    exit;
}

// =====================================================
// PROCESS FORM 1: Patient Services Form
// =====================================================
if ($is_patient_services_form) {
    
    // Collect & Sanitize Fields
    $full_name = isset($_POST['full_name']) ? clean_input($_POST['full_name']) : '';
    $age = isset($_POST['age']) ? clean_input($_POST['age']) : '';
    $mobile = isset($_POST['mobile']) ? clean_input($_POST['mobile']) : '';
    $email = isset($_POST['email']) ? clean_input($_POST['email']) : '';
    $gender = isset($_POST['gender']) ? clean_input($_POST['gender']) : '';
    $preferred_date = isset($_POST['preferred_date']) ? clean_input($_POST['preferred_date']) : '';
    $preferred_date_formatted = isset($_POST['preferred_date_formatted']) ? clean_input($_POST['preferred_date_formatted']) : '';
    $selectedDoctor = isset($_POST['selectedDoctor']) ? clean_input($_POST['selectedDoctor']) : '';
    $notes = isset($_POST['notes']) ? clean_input($_POST['notes']) : '';
    
    // Validation
    $errors = [];
    
    if (empty($full_name)) {
        $errors[] = 'Full name is required';
    }
    
    if (empty($age) || !is_numeric($age) || $age < 0 || $age > 120) {
        $errors[] = 'Valid age is required (0-120)';
    }
    
    if (empty($mobile) || !preg_match('/^\d{10}$/', $mobile)) {
        $errors[] = 'Valid 10-digit mobile number is required';
    }
    
    if (empty($gender)) {
        $errors[] = 'Gender is required';
    }
    
    if (empty($preferred_date)) {
        $errors[] = 'Preferred date is required';
    }
    
    // Email validation (optional but must be valid if provided)
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format';
    }
    
    // If validation fails, return error
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => implode(', ', $errors)
        ]);
        exit;
    }
    
    // Prepare Email
    $to = 'appointments@sschrc.org';
    $subject = 'New Book Appointment Lead';
    
    $message_body = "New Appointment Request Received\n";
    $message_body .= "=====================================\n\n";
    $message_body .= "PATIENT DETAILS:\n";
    $message_body .= "Full Name: " . $full_name . "\n";
    $message_body .= "Age: " . $age . "\n";
    $message_body .= "Mobile Number: " . $mobile . "\n";
    $message_body .= "Email: " . ($email ? $email : 'Not provided') . "\n";
    $message_body .= "Gender: " . $gender . "\n";
    $message_body .= "Preferred Date: " . ($preferred_date_formatted ? $preferred_date_formatted : $preferred_date) . "\n";
    $message_body .= "Doctor: " . ($selectedDoctor ? $selectedDoctor : 'Not specified') . "\n";
    $message_body .= "Additional Notes: " . ($notes ? $notes : 'None') . "\n\n";
    $message_body .= "=====================================\n";
    $message_body .= "Submission Time: " . date('Y-m-d H:i:s') . "\n";
    $message_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
    
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'From: Sri Shankara Hospital <noreply@srishankaracancerhospital.org>';
    $headers[] = 'Reply-To: ' . ($email ? $email : 'appointments@sschrc.org');
    $headers[] = 'X-Mailer: PHP/' . phpversion();
    
    $mail_sent = mail($to, $subject, $message_body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Thank you! Your appointment request has been submitted successfully. We will contact you shortly at ' . $mobile . '.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to send appointment request. Please try again or call +91-7090521000.'
        ]);
    }
    exit;
}

// =====================================================
// PROCESS FORM 2: Cancer Specialists Form
// =====================================================
if ($is_cancer_specialists_form) {
    
    // Collect & Sanitize Fields
    $patientName = isset($_POST['patientName']) ? clean_input($_POST['patientName']) : '';
    $patientAge = isset($_POST['patientAge']) ? clean_input($_POST['patientAge']) : '';
    $patientGender = isset($_POST['patientGender']) ? clean_input($_POST['patientGender']) : '';
    $contactNumber = isset($_POST['contactNumber']) ? clean_input($_POST['contactNumber']) : '';
    $patientEmail = isset($_POST['patientEmail']) ? clean_input($_POST['patientEmail']) : '';
    $visitType = isset($_POST['visitType']) ? clean_input($_POST['visitType']) : '';
    $selectedDoctor = isset($_POST['selectedDoctor']) ? clean_input($_POST['selectedDoctor']) : '';
    $appointmenttext = isset($_POST['appointmenttext']) ? clean_input($_POST['appointmenttext']) : '';
    $cancerConcern = isset($_POST['cancerConcern']) ? clean_input($_POST['cancerConcern']) : '';
    $additionalNotes = isset($_POST['additionalNotes']) ? clean_input($_POST['additionalNotes']) : '';
    
    // Validation
    $errors = [];
    
    if (empty($patientName)) {
        $errors[] = 'Patient name is required';
    }
    
    if (empty($patientAge) || !is_numeric($patientAge) || $patientAge < 0 || $patientAge > 120) {
        $errors[] = 'Valid age is required (0-120)';
    }
    
    if (empty($patientGender)) {
        $errors[] = 'Gender is required';
    }
    
    if (empty($contactNumber) || !preg_match('/^\d{10}$/', $contactNumber)) {
        $errors[] = 'Valid 10-digit mobile number is required';
    }
    
    if (empty($patientEmail) || !filter_var($patientEmail, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Valid email address is required';
    }
    
    if (empty($visitType)) {
        $errors[] = 'Visit type is required';
    }
    
    if (empty($appointmenttext)) {
        $errors[] = 'Appointment date is required';
    }
    
    if (empty($cancerConcern)) {
        $errors[] = 'Medical concern / Cancer type is required';
    }
    
    // If validation fails, return error
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => implode(', ', $errors)
        ]);
        exit;
    }
    
    // Prepare Email
    $to = 'appointments@sschrc.org';
    $subject = 'New Book Appointment Lead';
    
    $message_body = "New Appointment Request Received\n";
    $message_body .= "=====================================\n\n";
    $message_body .= "PATIENT DETAILS:\n";
    $message_body .= "Patient Name: " . $patientName . "\n";
    $message_body .= "Age: " . $patientAge . "\n";
    $message_body .= "Gender: " . $patientGender . "\n";
    $message_body .= "Contact Number: " . $contactNumber . "\n";
    $message_body .= "Email: " . $patientEmail . "\n";
    $message_body .= "Visit Type: " . $visitType . "\n";
    $message_body .= "Doctor: " . ($selectedDoctor ? $selectedDoctor : 'Not specified') . "\n";
    $message_body .= "Appointment Date: " . $appointmenttext . "\n";
    $message_body .= "Medical Concern / Cancer Type: " . $cancerConcern . "\n";
    $message_body .= "Additional Notes: " . ($additionalNotes ? $additionalNotes : 'None') . "\n\n";
    $message_body .= "=====================================\n";
    $message_body .= "Submission Time: " . date('Y-m-d H:i:s') . "\n";
    $message_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
    
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'From: Sri Shankara Hospital <noreply@srishankaracancerhospital.org>';
    $headers[] = 'Reply-To: ' . $patientEmail;
    $headers[] = 'X-Mailer: PHP/' . phpversion();
    
    $mail_sent = mail($to, $subject, $message_body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Thank you! Your appointment request has been submitted successfully. We will contact you shortly at ' . $contactNumber . '.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to send appointment request. Please try again or call +91-7090521000.'
        ]);
    }
    exit;
}

// =====================================================
// FALLBACK: No valid form detected
// =====================================================
http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'Invalid form submission. Please try again.'
]);
exit;
?>
