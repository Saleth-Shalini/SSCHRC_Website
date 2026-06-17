<?php
/**
 * hr_login.php — HR Admin Login
 * Sri Shankara Cancer Hospital Career Portal
 */

declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

startSecureSession();

// Already logged in → redirect
if (!empty($_SESSION['hr_logged_in'])) {
    header('Location: hr_dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = trim($_POST['csrf_token'] ?? '');
    if (!validateCsrfToken($csrfToken)) {
        $error = 'Invalid security token. Please reload and try again.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if ($username === '' || $password === '') {
            $error = 'Please enter both username and password.';
        } else {
            $pdo  = getDBConnection();
            $stmt = $pdo->prepare("SELECT id, password_hash, full_name, is_active FROM hr_users WHERE username = :u LIMIT 1");
            $stmt->execute([':u' => $username]);
            $user = $stmt->fetch();

            if ($user && $user['is_active'] && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['hr_logged_in'] = true;
                $_SESSION['hr_user_id']   = $user['id'];
                $_SESSION['hr_name']      = $user['full_name'];
                $_SESSION['last_regen']   = time();
                unset($_SESSION['csrf_token']);

                // Update last_login
                $pdo->prepare("UPDATE hr_users SET last_login = NOW() WHERE id = :id")
                    ->execute([':id' => $user['id']]);

                header('Location: hr_dashboard.php');
                exit;
            } else {
                $error = 'Invalid username or password.';
            }
        }
    }
}

$csrf = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HR Login — Sri Shankara Career Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--sea:#2e8b57;--sea-600:#27724a;--sea-50:#f0fbf6;--sea-100:#cce8d8;--saffron:#ff8c1a;--saffron-600:#d97312;--ink:#1f2937;--muted:#6b7280;--shadow:0 10px 30px rgba(0,0,0,.1)}
body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#f0fbf6 0%,#fff7f0 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:20px;padding:48px 40px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.12)}
.logo{display:flex;align-items:center;gap:12px;margin-bottom:32px;justify-content:center}

.logo-icon{
  width: 140px;
  height: 140px;
  border-radius: 14px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo-icon img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}



.logo-text{font-weight:800;font-size:1.1rem;color:var(--ink);line-height:1.3}
.logo-text span{display:block;font-weight:400;font-size:.85rem;color:var(--muted)}
h1{font-size:1.5rem;font-weight:800;color:var(--ink);margin-bottom:6px;text-align:center}
.sub{text-align:center;color:var(--muted);margin-bottom:28px;font-size:.95rem}
.field{margin-bottom:20px}
label{display:block;font-weight:600;font-size:.9rem;color:var(--ink);margin-bottom:6px}
.input-wrap{position:relative}
input[type=text],input[type=password]{width:100%;padding:12px 16px 12px 44px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:1rem;font-family:Inter,sans-serif;transition:border-color .2s,box-shadow .2s;color:var(--ink);background:#fafafa}
input:focus{outline:none;border-color:var(--sea);box-shadow:0 0 0 3px rgba(46,139,87,.12);background:#fff}
.input-wrap i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:.95rem}
.btn{width:100%;padding:14px;border-radius:10px;background:var(--saffron);color:#fff;font-weight:700;font-size:1rem;border:none;cursor:pointer;transition:all .2s;margin-top:8px}
.btn:hover{background:var(--saffron-600);transform:translateY(-1px);box-shadow:var(--shadow)}
.error{background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:12px 16px;color:#c53030;font-size:.9rem;margin-bottom:20px;display:flex;align-items:center;gap:8px}
.back{text-align:center;margin-top:20px;font-size:.9rem;color:var(--muted)}
.back a{color:var(--sea);font-weight:600;text-decoration:none}
.back a:hover{color:var(--saffron)}
.toggle-pass{position:absolute;right:14px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--muted);background:none;border:none;font-size:.9rem;padding:0}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
      
       <div class="logo-icon">
  <img src="https://srishankaracancerhospital.org/Banners/SSCHRC-Logo.png" alt="Hospital Logo">
</div>

    
    <div class="logo-text">Sri Shankara<span>Cancer Hospital &amp; Research Centre</span></div>
  </div>

  <h1>HR Admin Login</h1>
  <p class="sub">Secure access for HR personnel only</p>

  <?php if ($error): ?>
  <div class="error"><i class="fas fa-exclamation-circle"></i> <?= e($error) ?></div>
  <?php endif; ?>

  <form method="POST" action="hr_login.php" autocomplete="off">
    <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">

    <div class="field">
      <label for="username">Username</label>
      <div class="input-wrap">
        <i class="fas fa-user"></i>
        <input type="text" id="username" name="username" required
               value="<?= e($_POST['username'] ?? '') ?>"
               autocomplete="username" placeholder="Enter username">
      </div>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <div class="input-wrap">
        <i class="fas fa-lock"></i>
        <input type="password" id="password" name="password" required
               autocomplete="current-password" placeholder="Enter password">
        <button type="button" class="toggle-pass" onclick="togglePassword()" title="Show/Hide password">
          <i class="fas fa-eye" id="eye-icon"></i>
        </button>
      </div>
    </div>

    <button type="submit" class="btn"><i class="fas fa-sign-in-alt"></i> &nbsp; Sign In</button>
  </form>

  <p class="back"><a href="Careers.html"><i class="fas fa-arrow-left"></i> Back to Careers Page</a></p>
</div>

<script>
function togglePassword() {
  const pwd = document.getElementById('password');
  const icon = document.getElementById('eye-icon');
  if (pwd.type === 'password') {
    pwd.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    pwd.type = 'password';
    icon.className = 'fas fa-eye';
  }
}
</script>
</body>
</html>
