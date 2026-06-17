<?php
/**
 * logout.php — HR Admin Logout
 * Sri Shankara Cancer Hospital Career Portal
 */

declare(strict_types=1);
require_once __DIR__ . '/db_config.php';

startSecureSession();

// Destroy session completely
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}
session_destroy();

header('Location: hr_login.php');
exit;
