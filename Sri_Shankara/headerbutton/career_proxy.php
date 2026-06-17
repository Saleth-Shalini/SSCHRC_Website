<?php
// =============================================================================
// CAREER FORM API PROXY
// All dropdown loads and form submissions route through this file so that the
// browser never hits the API server directly (avoids CORS / self-signed-SSL).
//
// HOW TO CONFIGURE:
//   Edit career_api_config.php — update url and api_key for each endpoint.
// =============================================================================

$APIS = require __DIR__ . '/career_api_config.php';

// =============================================================================
// DO NOT EDIT BELOW THIS LINE
// =============================================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

$action = isset($_GET['action']) ? trim($_GET['action']) : '';

if (!array_key_exists($action, $APIS)) {
    echo json_encode(['_error' => true, 'message' => 'Unknown action: ' . htmlspecialchars($action)]);
    exit;
}

if (!function_exists('curl_init')) {
    echo json_encode(['_error' => true, 'message' => 'cURL is not enabled on this server. Enable php_curl in php.ini.']);
    exit;
}

$cfg = $APIS[$action];

// Validate placeholder — tell developer what to fill in
if (strpos($cfg['url'], 'PASTE_') === 0) {
    echo json_encode(['_error' => true, 'message' => 'API URL not configured for "' . $action . '". Open career_proxy.php and paste the real URL.']);
    exit;
}

$ch = curl_init();

$isPost = ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'Save');

if ($isPost) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'API_KEY: ' . $cfg['api_key'],
    ]);
} else {
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'API_KEY: ' . $cfg['api_key'],
    ]);
}

curl_setopt_array($ch, [
    CURLOPT_URL            => $cfg['url'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => [
        'API_KEY: ' . $cfg['api_key'],
    ],
]);

$response = curl_exec($ch);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    echo json_encode(['_error' => true, 'message' => 'cURL error: ' . $curlErr]);
} else {
    echo $response;
}
