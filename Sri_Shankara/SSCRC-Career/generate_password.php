<?php
/**
 * generate_password.php — One-time HR Password Hash Generator
 * Sri Shankara Cancer Hospital Career Portal
 *
 * HOW TO USE:
 *   1. Upload this file to your server alongside the other career portal files.
 *   2. Open it in your browser: https://yourdomain.com/careers/generate_password.php
 *   3. Enter your desired new password and click Generate Hash.
 *   4. Copy the hash shown, then run the SQL UPDATE shown on screen.
 *   5. DELETE THIS FILE from your server immediately after use.
 *
 * SECURITY: This file has NO authentication. Delete it after use.
 */
declare(strict_types=1);

$hash   = '';
$error  = '';
$sql    = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pwd    = $_POST['password']  ?? '';
    $pwd2   = $_POST['password2'] ?? '';
    $user   = trim($_POST['username'] ?? 'hradmin');

    if (strlen($pwd) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($pwd !== $pwd2) {
        $error = 'Passwords do not match.';
    } else {
        $hash = password_hash($pwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $sql  = "UPDATE hr_users SET password_hash='" . addslashes($hash) . "' WHERE username='" . addslashes($user) . "';";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Generate HR Password Hash</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#f0fbf6,#fff7f0);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:18px;padding:40px 36px;max-width:520px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.1)}
.warn{background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:14px 16px;color:#856404;font-size:.88rem;margin-bottom:24px;display:flex;gap:10px;align-items:flex-start}
.warn i{margin-top:1px;font-size:1rem}
h1{font-size:1.4rem;font-weight:800;color:#1f2937;margin-bottom:6px}
.sub{color:#6b7280;font-size:.9rem;margin-bottom:24px}
.field{margin-bottom:16px}
label{display:block;font-size:.82rem;font-weight:700;color:#4b5563;margin-bottom:5px;text-transform:uppercase;letter-spacing:.03em}
input[type=text],input[type=password]{width:100%;padding:10px 14px;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem;font-family:Inter,sans-serif;color:#1f2937;background:#fafafa}
input:focus{outline:none;border-color:#2e8b57;box-shadow:0 0 0 3px rgba(46,139,87,.1);background:#fff}
.btn{width:100%;padding:12px;border-radius:9px;background:#ff8c1a;color:#fff;font-weight:700;font-size:1rem;border:none;cursor:pointer;margin-top:6px;transition:.2s;font-family:Inter,sans-serif}
.btn:hover{background:#d97312}
.error{background:#fff5f5;border:1px solid #fc8181;border-radius:9px;padding:12px 14px;color:#c53030;font-size:.88rem;margin-top:14px}
.result{background:#f0fbf6;border:1px solid #cce8d8;border-radius:12px;padding:20px;margin-top:20px}
.result h3{color:#2e8b57;font-size:.95rem;font-weight:700;margin-bottom:10px}
.hash-box{background:#1f2937;color:#a3e635;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:.8rem;word-break:break-all;margin-bottom:14px}
.sql-box{background:#f3f4f6;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:.8rem;word-break:break-all;color:#374151}
.copy-btn{background:#2e8b57;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:.8rem;font-weight:600;cursor:pointer;margin-top:8px;font-family:Inter,sans-serif}
.copy-btn:hover{background:#27724a}
.delete-reminder{background:#fee2e2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;color:#dc2626;font-size:.85rem;margin-top:16px;font-weight:600}
</style>
</head>
<body>
<div class="card">
  <div class="warn">
    <i>⚠️</i>
    <div><strong>Security Notice:</strong> This utility has no authentication. Delete it from your server immediately after generating your password hash.</div>
  </div>

  <h1>HR Password Generator</h1>
  <p class="sub">Generate a bcrypt hash for a new HR admin password</p>

  <form method="POST">
    <div class="field">
      <label>HR Username</label>
      <input type="text" name="username" value="<?= htmlspecialchars($_POST['username'] ?? 'hradmin', ENT_QUOTES) ?>" placeholder="hradmin">
    </div>
    <div class="field">
      <label>New Password (min 8 chars)</label>
      <input type="password" name="password" required placeholder="Enter new password">
    </div>
    <div class="field">
      <label>Confirm Password</label>
      <input type="password" name="password2" required placeholder="Repeat password">
    </div>
    <button type="submit" class="btn">Generate Hash</button>
  </form>

  <?php if ($error): ?>
  <div class="error">❌ <?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <?php if ($hash): ?>
  <div class="result">
    <h3>✅ Hash Generated Successfully</h3>
    <p style="font-size:.82rem;color:#4b5563;margin-bottom:6px">Bcrypt hash (copy this):</p>
    <div class="hash-box" id="hash-val"><?= htmlspecialchars($hash) ?></div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('hash-val').textContent).then(()=>this.textContent='Copied!')">
      Copy Hash
    </button>

    <p style="font-size:.82rem;color:#4b5563;margin:14px 0 6px">Run this SQL in phpMyAdmin:</p>
    <div class="sql-box" id="sql-val"><?= htmlspecialchars($sql) ?></div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('sql-val').textContent).then(()=>this.textContent='Copied!')">
      Copy SQL
    </button>
  </div>

  <div class="delete-reminder">
    🔴 DELETE this file (generate_password.php) from your server NOW.
  </div>
  <?php endif; ?>
</div>
</body>
</html>
