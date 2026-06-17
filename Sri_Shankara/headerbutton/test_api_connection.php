<?php
// Temporary diagnostic — DELETE after testing
header('Content-Type: application/json');

$results = [];

// Test 1 & 2 — Can this server reach the API ports?
$ports = [
    'Port 4446 (dropdowns)' => 4446,
    'Port 4447 (save form)' => 4447,
    'Port 443 (standard HTTPS - control test)' => 443,
    'Port 80  (standard HTTP  - control test)' => 80,
];

foreach ($ports as $label => $port) {
    $conn = @fsockopen('182.76.140.156', $port, $errno, $errstr, 5);
    if ($conn) {
        fclose($conn);
        $results[$label] = 'REACHABLE';
    } else {
        $results[$label] = 'BLOCKED — ' . $errstr;
    }
}

// Test 3 — Show this server's outgoing IP (to give to API team)
$myIp = @file_get_contents('https://api.ipify.org');

echo json_encode([
    'this_server_outgoing_ip' => $myIp ?: 'Could not detect',
    'port_tests'              => $results,
], JSON_PRETTY_PRINT);
