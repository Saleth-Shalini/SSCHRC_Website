<?php
/**
 * Sync career application data to the external CarrierPageDataInsert API.
 * Non-blocking: logs errors; does not throw to callers.
 */
function careerSyncToExternalApi(array $record): void
{
    if (!function_exists('curl_init')) {
        error_log('[Career API Sync] cURL not available.');
        return;
    }

    $apis = require __DIR__ . '/career_api_config.php';
    if (empty($apis['Save']['url']) || empty($apis['Save']['api_key'])) {
        error_log('[Career API Sync] Save endpoint not configured.');
        return;
    }

    $cfg = $apis['Save'];
    $payload = json_encode([$record]);
    if ($payload === false) {
        error_log('[Career API Sync] JSON encode failed.');
        return;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $cfg['url'],
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'API_KEY: ' . $cfg['api_key'],
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    $apiResp = curl_exec($ch);
    $apiErr  = curl_error($ch);
    $apiCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $email = $record['EMAIL'] ?? 'unknown';

    if ($apiErr) {
        error_log('[Career API Sync] cURL error for ' . $email . ': ' . $apiErr);
        return;
    }

    if ($apiCode < 200 || $apiCode >= 300) {
        error_log('[Career API Sync] FAILED for ' . $email . ' (HTTP ' . $apiCode . ') — Response: ' . substr((string) $apiResp, 0, 500));
        return;
    }

    $apiData = json_decode((string) $apiResp, true);
    if (is_array($apiData) && !empty($apiData['_error'])) {
        error_log('[Career API Sync] API error for ' . $email . ': ' . ($apiData['message'] ?? $apiResp));
        return;
    }

    error_log('[Career API Sync] Success for ' . $email . ' (HTTP ' . $apiCode . ')');
}

/**
 * Build absolute URL for uploaded CV (ATTACHMENTURL).
 */
function careerAttachmentAbsoluteUrl(?string $relativePath): string
{
    if ($relativePath === null || $relativePath === '') {
        return '';
    }

    if (preg_match('#^https?://#i', $relativePath)) {
        return $relativePath;
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base   = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');

    return $scheme . '://' . $host . ($base !== '' ? $base . '/' : '/') . ltrim($relativePath, '/');
}
