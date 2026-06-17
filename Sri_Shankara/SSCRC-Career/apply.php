<?php
/**
 * apply.php — Career Application Form Handler (FIXED)
 * Sri Shankara Cancer Hospital Career Portal
 *
 * FIXES IN THIS VERSION:
 * ─────────────────────────────────────────────────────────────────
 * FIX 1: Content-Type is set to JSON FIRST, before anything else.
 *         Was: header('Content-Type: text/html') — plain HTML caused
 *         SyntaxError when JS called r.json().
 *
 * FIX 2: All exit paths (CSRF fail, validation fail, DB error, success)
 *         return JSON. No path can output plain text or HTML.
 *
 * FIX 3: experience_years / experience_months read safely with isset()
 *         before comparison. Was: $_POST['key'] !== '' without isset()
 *         → PHP notice on missing keys.
 *
 * FIX 4: jsonFatal() from db_config.php handles DB connection failures
 *         with proper JSON (see db_config.php FIX 1).
 *
 * FIX 5: CSRF token is NOT destroyed after success — kept alive so the
 *         same-page AJAX can refresh it via get_csrf.php for resubmission.
 * ─────────────────────────────────────────────────────────────────
 */

declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

// ── FIX 1: Set JSON Content-Type IMMEDIATELY — before any other output ────────
// This must come before startSecureSession() so even session errors
// return JSON, not HTML.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

startSecureSession();

// ── JSON response helper ───────────────────────────────────────────────────────
function jsonOut(bool $success, string $message): void
{
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// ── Only accept POST ───────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Non-POST: redirect without JSON (this is a browser navigation, not AJAX)
    header('Content-Type: text/html; charset=UTF-8', true);
    header('Location: Careers.html');
    exit;
}

// ── CSRF Validation ────────────────────────────────────────────────────────────
$csrfToken = trim($_POST['csrf_token'] ?? '');
if (!validateCsrfToken($csrfToken)) {
    error_log('[Career CSRF Fail] Token: ' . $csrfToken . ' | Session: ' . ($_SESSION['csrf_token'] ?? 'NONE'));
    jsonOut(false, 'Security token invalid or expired. Please refresh the page and try again.');
}

// ── Sanitize helper ────────────────────────────────────────────────────────────
function cleanInput(string $value): string
{
    return trim(strip_tags($value));
}

// ── Collect & sanitize all POST fields ────────────────────────────────────────
$post_applied_for    = cleanInput($_POST['post_applied_for']    ?? '');
$title               = cleanInput($_POST['title']               ?? '');
$first_name          = cleanInput($_POST['first_name']          ?? '');
$middle_name         = cleanInput($_POST['middle_name']         ?? '');
$last_name           = cleanInput($_POST['last_name']           ?? '');
$date_of_birth       = cleanInput($_POST['date_of_birth']       ?? '');
$address             = cleanInput($_POST['address']             ?? '');
$nationality         = cleanInput($_POST['nationality']         ?? '');
$gender              = cleanInput($_POST['gender']              ?? '');
$contact_number      = cleanInput($_POST['contact_number']      ?? '');
$email_id            = filter_var(trim($_POST['email_id'] ?? ''), FILTER_SANITIZE_EMAIL);
$registration_no     = cleanInput($_POST['registration_no']     ?? '');
$qualification_1     = cleanInput($_POST['qualification_1']     ?? '');
$qualification_2     = cleanInput($_POST['qualification_2']     ?? '');
$qualification_3     = cleanInput($_POST['qualification_3']     ?? '');
$qualification_4     = cleanInput($_POST['qualification_4']     ?? '');
$preferred_location  = 'Bangalore';   // Always fixed per requirement
$current_designation = cleanInput($_POST['current_designation'] ?? '');
$current_company     = cleanInput($_POST['current_company']     ?? '');
$ip_address          = $_SERVER['REMOTE_ADDR'] ?? '';

// FIX 3: Safe numeric field extraction — isset() check prevents PHP notices
// on missing keys (empty form submissions or optional fields left blank).
$experience_years  = (isset($_POST['experience_years'])  && $_POST['experience_years']  !== '')
                     ? (int)$_POST['experience_years']  : null;
$experience_months = (isset($_POST['experience_months']) && $_POST['experience_months'] !== '')
                     ? (int)$_POST['experience_months'] : null;
$notice_period     = (isset($_POST['notice_period'])     && $_POST['notice_period']     !== '')
                     ? (int)$_POST['notice_period']     : null;

$current_ctc_raw = cleanInput($_POST['current_ctc']  ?? '');
$expected_ctc_raw = cleanInput($_POST['expected_ctc'] ?? '');
$current_ctc  = ($current_ctc_raw  !== '') ? (float)$current_ctc_raw  : null;
$expected_ctc = ($expected_ctc_raw !== '') ? (float)$expected_ctc_raw : null;

// Applied-on is always server-generated — never trust the client display value
$applied_on = date('Y-m-d H:i:s');

// ── Server-Side Validation ─────────────────────────────────────────────────────
$errors = [];

if ($post_applied_for === '') $errors[] = 'Post Applied For is required.';
if ($title === '')            $errors[] = 'Title is required.';
if ($first_name === '')       $errors[] = 'First Name is required.';
if ($last_name === '')        $errors[] = 'Last Name is required.';
if ($address === '')          $errors[] = 'Address is required.';
if ($nationality === '')      $errors[] = 'Nationality is required.';
if ($gender === '')           $errors[] = 'Gender is required.';
if ($qualification_1 === '') $errors[] = 'At least Qualification 1 is required.';

if ($contact_number === '') {
    $errors[] = 'Contact Number is required.';
} elseif (!ctype_digit($contact_number)) {
    $errors[] = 'Contact Number must contain digits only (no spaces or dashes).';
} elseif (strlen($contact_number) > 20) {
    $errors[] = 'Contact Number must not exceed 20 digits.';
}

if ($email_id === '' || !filter_var($email_id, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid Email Id is required.';
}

// Validate date of birth format
$dob = null;
if ($date_of_birth !== '') {
    $dobParsed = DateTime::createFromFormat('Y-m-d', $date_of_birth);
    if (!$dobParsed || $dobParsed->format('Y-m-d') !== $date_of_birth) {
        $errors[] = 'Date of Birth format is invalid.';
    } else {
        $dob = $date_of_birth;
    }
}

// ── File Upload Validation ─────────────────────────────────────────────────────
$cv_file_path     = null;
$cv_original_name = null;

$fileError = $_FILES['cv_file']['error'] ?? UPLOAD_ERR_NO_FILE;

if ($fileError === UPLOAD_ERR_NO_FILE || !isset($_FILES['cv_file'])) {
    $errors[] = 'CV file is required. Please upload a PDF, DOC, or DOCX file.';
} else {
    if ($fileError !== UPLOAD_ERR_OK) {
        $uploadErrorMessages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload size limit (check php.ini upload_max_filesize).',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded. Please try again.',
            UPLOAD_ERR_NO_TMP_DIR => 'Server has no temp directory for uploads. Contact admin.',
            UPLOAD_ERR_CANT_WRITE => 'Server cannot write to disk. Contact admin.',
            UPLOAD_ERR_EXTENSION  => 'Upload blocked by a PHP extension.',
        ];
        $errors[] = $uploadErrorMessages[$fileError] ?? "File upload failed (PHP error code: $fileError).";
    } else {
        $originalName = basename($_FILES['cv_file']['name']);
        $ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $finfo        = new finfo(FILEINFO_MIME_TYPE);
        $mimeType     = $finfo->file($_FILES['cv_file']['tmp_name']);

        if (!in_array($ext, ALLOWED_EXT, true)) {
            $errors[] = 'CV must be PDF, DOC, or DOCX format. Received: .' . $ext;
        } elseif (!in_array($mimeType, ALLOWED_MIME, true)) {
            $errors[] = 'File content does not match allowed types (PDF/DOC/DOCX). Detected: ' . $mimeType;
        } elseif ($_FILES['cv_file']['size'] > MAX_FILE_SIZE) {
            $sizeMB = round($_FILES['cv_file']['size'] / 1024 / 1024, 2);
            $errors[] = "CV file is too large ({$sizeMB} MB). Maximum allowed is 2 MB.";
        } elseif (!is_uploaded_file($_FILES['cv_file']['tmp_name'])) {
            $errors[] = 'Invalid file upload request.';
        }
    }
}

// ── Return validation errors as JSON ──────────────────────────────────────────
if (!empty($errors)) {
    jsonOut(false, implode('<br>', $errors));
}

// ── Move uploaded file (only after all validation passes) ─────────────────────
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
    // Prevent direct browser access to the uploads folder
    if (!file_exists(UPLOAD_DIR . '.htaccess')) {
    file_put_contents(
        UPLOAD_DIR . '.htaccess',
        "Options -Indexes\nRequire all denied\n"
    );
}
}

$safeName    = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
$newFilename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '_' . $safeName . '.' . $ext;
$destination = UPLOAD_DIR . $newFilename;

if (!move_uploaded_file($_FILES['cv_file']['tmp_name'], $destination)) {
    jsonOut(false, 'Could not save CV file. Please check folder permissions (uploads/cv/ must be writable) and try again.');
}

$cv_file_path     = UPLOAD_URL_PATH . $newFilename;
$cv_original_name = $originalName;

// ── Insert into Database ───────────────────────────────────────────────────────
// getDBConnection() will call jsonFatal() (JSON-safe) if DB is unreachable.
$pdo = getDBConnection();

$sql = "INSERT INTO job_applications (
    post_applied_for, applied_on, title, first_name, middle_name, last_name,
    date_of_birth, address, nationality, gender,
    contact_number, email_id, registration_no,
    qualification_1, qualification_2, qualification_3, qualification_4,
    preferred_location, experience_years, experience_months,
    current_ctc, expected_ctc, current_designation, current_company,
    notice_period, cv_file_path, cv_original_name, ip_address
) VALUES (
    :post_applied_for, :applied_on, :title, :first_name, :middle_name, :last_name,
    :date_of_birth, :address, :nationality, :gender,
    :contact_number, :email_id, :registration_no,
    :qualification_1, :qualification_2, :qualification_3, :qualification_4,
    :preferred_location, :experience_years, :experience_months,
    :current_ctc, :expected_ctc, :current_designation, :current_company,
    :notice_period, :cv_file_path, :cv_original_name, :ip_address
)";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':post_applied_for'    => $post_applied_for,
        ':applied_on'          => $applied_on,
        ':title'               => $title,
        ':first_name'          => $first_name,
        ':middle_name'         => $middle_name ?: null,
        ':last_name'           => $last_name,
        ':date_of_birth'       => $dob,
        ':address'             => $address,
        ':nationality'         => $nationality,
        ':gender'              => $gender,
        ':contact_number'      => $contact_number,
        ':email_id'            => $email_id,
        ':registration_no'     => $registration_no ?: null,
        ':qualification_1'     => $qualification_1 ?: null,
        ':qualification_2'     => $qualification_2 ?: null,
        ':qualification_3'     => $qualification_3 ?: null,
        ':qualification_4'     => $qualification_4 ?: null,
        ':preferred_location'  => $preferred_location,
        ':experience_years'    => $experience_years,
        ':experience_months'   => $experience_months,
        ':current_ctc'         => $current_ctc,
        ':expected_ctc'        => $expected_ctc,
        ':current_designation' => $current_designation ?: null,
        ':current_company'     => $current_company     ?: null,
        ':notice_period'       => $notice_period,
        ':cv_file_path'        => $cv_file_path,
        ':cv_original_name'    => $cv_original_name,
        ':ip_address'          => $ip_address,
    ]);

    jsonOut(true, 'Your application has been successfully submitted. If shortlisted, HR department will contact you.');

} catch (PDOException $e) {
    error_log('[Career Apply DB Insert Error] ' . $e->getMessage());

    // Roll back uploaded CV file so disk doesn't accumulate orphaned files
    if ($cv_file_path && file_exists($destination)) {
        unlink($destination);
    }

    jsonOut(false, 'A database error occurred while saving your application. Please try again in a few minutes.');
}
