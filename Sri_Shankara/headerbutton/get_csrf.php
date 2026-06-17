<?php
/**
 * get_csrf.php — CSRF Token Endpoint
 * Sri Shankara Cancer Hospital Career Portal
 *
 * Called via fetch('get_csrf.php', {credentials:'include'}) from Careers.html.
 * Must use the SAME session cookie settings as apply.php / db_config.php,
 * otherwise the browser treats them as different sessions and CSRF fails.
 *
 * FIX: SameSite must be 'Lax' (matching db_config.php startSecureSession).
 *      'Strict' causes the browser to create a new session for AJAX fetch calls,
 *      so the token stored here never matches what apply.php sees.
 */
declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

// Allow same-origin fetch() with credentials to receive the session cookie
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Content-Type: text/plain; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

// startSecureSession() in db_config.php now uses SameSite=Lax — correct
echo generateCsrfToken();
