<?php
/**
 * download_cv.php — Secure CV File Delivery
 * Sri Shankara Cancer Hospital Career Portal
 *
 * Serves CV files through PHP (never directly from disk),
 * so the /uploads/cv/ folder can remain inaccessible from the web.
 */

declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

// UPLOAD_DIR must be defined here — this file never includes apply.php.
// Guard with defined() in case db_config.php already sets it.
if (!defined('UPLOAD_DIR')) {
    define('UPLOAD_DIR', __DIR__ . '/uploads/cv/');
}

// Check authentication before requireHrLogin() so the redirect always
// goes to the correct login page in this folder.
startSecureSession();
if (empty($_SESSION['hr_logged_in'])) {
    header('Location: hr_login.php');
    exit;
}
requireHrLogin(); // additional checks from db_config.php

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    http_response_code(400);
    die('Invalid request.');
}

$pdo  = getDBConnection();
$stmt = $pdo->prepare("SELECT cv_file_path, cv_original_name FROM job_applications WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $id]);
$row  = $stmt->fetch();

if (!$row || empty($row['cv_file_path'])) {
    http_response_code(404);
    die('CV file not found for this application.');
}



// Normalize DB value
$relativePath = ltrim($row['cv_file_path'], '/');

// Extract only filename (important)
$filename = basename($relativePath);

// Build path using UPLOAD_DIR ONLY
$fullPath = UPLOAD_DIR . $filename;



if (!file_exists($fullPath) || !is_file($fullPath)) {
    http_response_code(404);
    die('CV file does not exist on server.');
}

// Security: make sure the resolved path stays inside UPLOAD_DIR
$realFull   = realpath($fullPath);
$realUpload = realpath(UPLOAD_DIR);
if (!$realFull || !$realUpload || strpos($realFull, $realUpload) !== 0) {
    http_response_code(403);
    die('Access denied.');
}

$ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
$mimeMap = [
    'pdf'  => 'application/pdf',
    'doc'  => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
$mime = $mimeMap[$ext] ?? 'application/octet-stream';

$originalName = $row['cv_original_name'] ?: 'cv_' . $id . '.' . $ext;
// Sanitize filename for Content-Disposition
$safeOriginal = preg_replace('/[^\w\.\-]/', '_', $originalName);

header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . $safeOriginal . '"');
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

// Stream the file
readfile($fullPath);
exit;
