<?php
/**
 * hr_dashboard.php — HR Admin Dashboard (FIXED)
 * Sri Shankara Cancer Hospital Career Portal
 *
 * FIXES IN THIS VERSION:
 * 1. cleanFilter() declared BEFORE first use (was called on line 15, defined on line 27).
 * 2. Bulk ZIP block moved BEFORE any HTML output (was after </html> — headers already sent).
 * 3. ob_start() / ob_end_clean() used so stray whitespace never breaks header() calls.
 * 4. CSV export confirmed correct (was already before HTML output).
 * 5. Stats query uses applied_on >= DATE_SUB (more accurate than DATE()).
 * 6. json_encode uses HEX flags to prevent XSS in modal data attributes.
 */

declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

ob_start(); // buffer everything — lets us send headers even after accidental output

requireHrLogin();

$pdo = getDBConnection();

// ── Helpers — declared FIRST before any use ───────────────────────────────────
function cleanFilter(string $v): string
{
    return trim(strip_tags($v));
}

function buildQS(array $extra = []): string
{
    $merged = array_merge($_GET, $extra);
    unset($merged['page'], $merged['export_csv'], $merged['bulk_zip']);
    return http_build_query(array_filter($merged, fn($v) => $v !== ''));
}

// ── Filters ───────────────────────────────────────────────────────────────────
$filterPost     = cleanFilter($_GET['post']      ?? '');
$filterExpMin   = isset($_GET['exp_min'])  && $_GET['exp_min']  !== '' ? (int)$_GET['exp_min']  : null;
$filterExpMax   = isset($_GET['exp_max'])  && $_GET['exp_max']  !== '' ? (int)$_GET['exp_max']  : null;
$filterQual     = cleanFilter($_GET['qual']      ?? '');
$filterDateFrom = cleanFilter($_GET['date_from'] ?? '');
$filterDateTo   = cleanFilter($_GET['date_to']   ?? '');
$filterSearch   = cleanFilter($_GET['search']    ?? '');
$page           = max(1, (int)($_GET['page'] ?? 1));
$perPage        = 20;
$offset         = ($page - 1) * $perPage;

// ── WHERE clause ──────────────────────────────────────────────────────────────
$where  = [];
$params = [];

if ($filterPost !== '') {
    $where[]         = 'post_applied_for LIKE :post';
    $params[':post'] = '%' . $filterPost . '%';
}
if ($filterExpMin !== null) {
    $where[]            = 'experience_years >= :exp_min';
    $params[':exp_min'] = $filterExpMin;
}
if ($filterExpMax !== null) {
    $where[]            = 'experience_years <= :exp_max';
    $params[':exp_max'] = $filterExpMax;
}
if ($filterQual !== '') {
    $where[]         = '(qualification_1 LIKE :qual OR qualification_2 LIKE :qual OR qualification_3 LIKE :qual OR qualification_4 LIKE :qual)';
    $params[':qual'] = '%' . $filterQual . '%';
}
if ($filterDateFrom !== '') {
    $where[]              = 'DATE(applied_on) >= :date_from';
    $params[':date_from'] = $filterDateFrom;
}
if ($filterDateTo !== '') {
    $where[]            = 'DATE(applied_on) <= :date_to';
    $params[':date_to'] = $filterDateTo;
}
if ($filterSearch !== '') {
    $where[]      = '(first_name LIKE :s OR last_name LIKE :s OR email_id LIKE :s OR contact_number LIKE :s)';
    $params[':s'] = '%' . $filterSearch . '%';
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORT ACTIONS — MUST be before any HTML output
// ═══════════════════════════════════════════════════════════════════════════════

// ── CSV Export ────────────────────────────────────────────────────────────────
if (isset($_GET['export_csv']) && $_GET['export_csv'] === '1') {
    ob_end_clean();

    $stmt = $pdo->prepare("SELECT * FROM job_applications $whereSQL ORDER BY applied_on DESC");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="applications_' . date('Ymd_His') . '.csv"');
    header('Pragma: no-cache');
    header('Cache-Control: no-store');
    echo "\xEF\xBB\xBF"; // BOM for Excel

    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'ID','Post Applied For','Applied On','Title','First Name','Middle Name','Last Name',
        'DOB','Address','Nationality','Gender','Contact Number','Email Id','Reg No',
        'Qualification 1','Qualification 2','Qualification 3','Qualification 4',
        'Preferred Location','Exp Years','Exp Months','Current CTC','Expected CTC',
        'Current Designation','Current Company','Notice Period (days)','CV Filename',
    ]);
    foreach ($rows as $r) {
        fputcsv($out, [
            $r['id'], $r['post_applied_for'], $r['applied_on'], $r['title'],
            $r['first_name'], $r['middle_name'], $r['last_name'],
            $r['date_of_birth'], $r['address'], $r['nationality'], $r['gender'],
            $r['contact_number'], $r['email_id'], $r['registration_no'],
            $r['qualification_1'], $r['qualification_2'], $r['qualification_3'], $r['qualification_4'],
            $r['preferred_location'], $r['experience_years'], $r['experience_months'],
            $r['current_ctc'], $r['expected_ctc'],
            $r['current_designation'], $r['current_company'], $r['notice_period'],
            $r['cv_original_name'],
        ]);
    }
    fclose($out);
    exit;
}

// ── Bulk ZIP Download — FIXED: moved here from AFTER </html> ─────────────────
if (isset($_GET['bulk_zip']) && $_GET['bulk_zip'] === '1') {
    ob_end_clean();

    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        die('ZIP extension is not available on this server. Please contact your hosting provider.');
    }

    $stmt = $pdo->prepare(
        "SELECT id, cv_file_path, cv_original_name, first_name, last_name
         FROM job_applications $whereSQL
         ORDER BY applied_on DESC"
    );
    $stmt->execute($params);
    $zipRows = $stmt->fetchAll();

    $cvRows = array_filter($zipRows, fn($r) => !empty($r['cv_file_path']));
    if (empty($cvRows)) {
        http_response_code(404);
        die('No CV files found for the current filter selection.');
    }

    $tmpFile = sys_get_temp_dir() . '/cvs_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.zip';
    $zip     = new ZipArchive();

    if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        http_response_code(500);
        die('Could not create ZIP file. Check server temp directory permissions.');
    }

    foreach ($cvRows as $r) {
        $fullPath = __DIR__ . $r['cv_file_path'];
        if (!file_exists($fullPath) || !is_file($fullPath)) continue;

        $safeName = 'CV_' . $r['id'] . '_'
            . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $r['first_name'] . '_' . $r['last_name'])
            . '_' . basename($r['cv_file_path']);

        $zip->addFile($fullPath, $safeName);
    }
    $zip->close();

    if (!file_exists($tmpFile) || filesize($tmpFile) === 0) {
        http_response_code(500);
        die('ZIP archive is empty or could not be written.');
    }

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="CVs_' . date('Ymd_His') . '.zip"');
    header('Content-Length: ' . filesize($tmpFile));
    header('Pragma: no-cache');
    header('Cache-Control: no-store');
    readfile($tmpFile);
    unlink($tmpFile);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Dashboard page queries
// ═══════════════════════════════════════════════════════════════════════════════

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM job_applications $whereSQL");
$countStmt->execute($params);
$totalRows  = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($totalRows / $perPage));

$dataStmt = $pdo->prepare(
    "SELECT * FROM job_applications $whereSQL ORDER BY applied_on DESC LIMIT :limit OFFSET :offset"
);
foreach ($params as $k => $v) {
    $dataStmt->bindValue($k, $v);
}
$dataStmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$dataStmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$dataStmt->execute();
$applications = $dataStmt->fetchAll();

$posts = $pdo->query(
    "SELECT DISTINCT post_applied_for FROM job_applications ORDER BY post_applied_for ASC"
)->fetchAll(PDO::FETCH_COLUMN);

$stats = $pdo->query(
    "SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(applied_on) = CURDATE() THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN applied_on >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS this_week
     FROM job_applications"
)->fetch();

$csrf = generateCsrfToken();

ob_end_flush(); // send buffered output, now HTML starts
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HR Dashboard — Sri Shankara Career Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --sea:#2e8b57;--sea-600:#27724a;--sea-50:#f0fbf6;--sea-100:#cce8d8;
  --saffron:#ff8c1a;--saffron-600:#d97312;--saffron-50:#fff7f0;
  --ink:#1f2937;--ink-light:#4b5563;--muted:#6b7280;
  --bg:#f8fafc;--card:#fff;--border:#e5e7eb;
  --shadow:0 2px 8px rgba(0,0,0,.07);--radius:12px
}
body{font-family:Inter,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh}
a{color:var(--sea);text-decoration:none}
a:hover{color:var(--saffron)}
.layout{display:flex;min-height:100vh}

/* Sidebar */
.sidebar{width:240px;background:var(--ink);flex-shrink:0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-logo{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
.sidebar-logo .name{color:#fff;font-weight:800;font-size:1rem}
.sidebar-logo .sub{color:rgba(255,255,255,.4);font-size:.75rem;margin-top:3px}
.sidebar-nav{padding:14px 10px;flex:1}
.nav-label{color:rgba(255,255,255,.35);font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 8px 4px;margin-top:10px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:rgba(255,255,255,.7);font-size:.875rem;font-weight:500;transition:.2s;margin-bottom:2px;text-decoration:none;cursor:pointer}
.nav-item:hover,.nav-item.active{background:rgba(255,255,255,.1);color:#fff}
.nav-item i{width:16px;text-align:center;font-size:.82rem}
.sidebar-footer{padding:16px 18px;border-top:1px solid rgba(255,255,255,.1)}
.sidebar-user{color:rgba(255,255,255,.55);font-size:.8rem;margin-bottom:10px}
.sidebar-user strong{display:block;color:#fff;font-size:.875rem;margin-bottom:2px}

/* Main */
.main{flex:1;overflow-x:hidden;min-width:0}
.topbar{background:#fff;border-bottom:1px solid var(--border);padding:13px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:10;flex-wrap:wrap}
.topbar h1{font-size:1.15rem;font-weight:800}
.topbar-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:8px;font-weight:600;font-size:.83rem;border:none;cursor:pointer;transition:.18s;text-decoration:none;white-space:nowrap;font-family:Inter,sans-serif}
.btn-sea{background:var(--sea);color:#fff} .btn-sea:hover{background:var(--sea-600)}
.btn-ghost{background:#fff;color:var(--ink-light);border:1px solid var(--border)} .btn-ghost:hover{background:#f9fafb;color:var(--ink)}
.btn-danger{background:#fee2e2;color:#dc2626;border:1px solid #fecaca} .btn-danger:hover{background:#fecaca}
.btn-primary{background:var(--saffron);color:#fff} .btn-primary:hover{background:var(--saffron-600)}
.btn-sm{padding:5px 9px;font-size:.77rem}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px 22px 0}
.stat-card{background:var(--card);border-radius:var(--radius);padding:16px 20px;border:1px solid var(--border);box-shadow:var(--shadow)}
.stat-number{font-size:1.8rem;font-weight:800;line-height:1}
.stat-label{color:var(--muted);font-size:.8rem;margin-top:3px}

/* Filter panel */
.filter-panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;margin:14px 22px 0;box-shadow:var(--shadow)}
.filter-panel h3{font-size:.85rem;font-weight:700;margin-bottom:11px}
.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:9px}
.fg label{display:block;font-size:.7rem;font-weight:700;color:var(--muted);margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em}
.fg input,.fg select{width:100%;padding:6px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:.83rem;font-family:Inter,sans-serif;color:var(--ink);background:#fafafa}
.fg input:focus,.fg select:focus{outline:none;border-color:var(--sea);background:#fff}
.filter-actions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}

/* Table */
.table-wrap{margin:12px 22px 28px;background:var(--card);border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow);overflow:hidden}
.table-header{padding:11px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.result-count{font-size:.82rem;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:.83rem}
thead{background:#f9fafb}
th{padding:9px 12px;text-align:left;font-weight:700;font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.check-col{width:34px;text-align:center}
input[type=checkbox]{cursor:pointer;accent-color:var(--sea)}
.tag-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sea-50);color:var(--sea);border:1px solid var(--sea-100)}
.no-data{padding:44px;text-align:center;color:var(--muted)}
.no-data i{font-size:2.2rem;display:block;margin-bottom:10px;opacity:.35}

/* Pagination */
.pagination{display:flex;align-items:center;justify-content:center;gap:4px;padding:16px}
.page-btn{padding:5px 10px;border-radius:7px;border:1px solid var(--border);color:var(--ink-light);font-size:.8rem;background:#fff;transition:.15s;text-decoration:none;display:inline-flex;align-items:center}
.page-btn:hover,.page-btn.active{background:var(--sea);color:#fff;border-color:var(--sea)}
.page-btn.disabled{opacity:.4;pointer-events:none}

/* Modal */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.modal-overlay.open{display:flex}
.modal{background:#fff;border-radius:14px;padding:26px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:auto}
.modal-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px}
.modal-title{font-size:1.05rem;font-weight:800;color:var(--ink);line-height:1.3}
.modal-close{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--muted);padding:0;line-height:1;flex-shrink:0}
.modal-close:hover{color:var(--ink)}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.di label{display:block;font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
.di p{color:var(--ink);font-size:.86rem;word-break:break-word}
.sec-div{grid-column:1/-1;border-top:1px solid var(--border);padding-top:9px;margin-top:2px;font-weight:700;font-size:.77rem;color:var(--sea);text-transform:uppercase;letter-spacing:.07em}

@media(max-width:900px){.sidebar{display:none}.stats-row{grid-template-columns:1fr 1fr}.detail-grid{grid-template-columns:1fr}}
@media(max-width:600px){.stats-row{grid-template-columns:1fr}.filter-grid{grid-template-columns:1fr 1fr}.topbar{flex-direction:column;align-items:flex-start}}
</style>
</head>
<body>
<div class="layout">

  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="name">Sri Shankara</div>
      <div class="sub">HR Career Portal</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">Navigation</div>
      <span class="nav-item active"><i class="fas fa-users"></i> Applications</span>
      <a href="?export_csv=1&<?= buildQS() ?>" class="nav-item"><i class="fas fa-file-csv"></i> Export CSV</a>
      <a href="?bulk_zip=1&<?= buildQS() ?>"   class="nav-item"><i class="fas fa-file-archive"></i> Bulk Download CVs</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <strong><?= e($_SESSION['hr_name'] ?? 'HR User') ?></strong>
        HR Administrator
      </div>
      <a href="logout.php" class="btn btn-danger btn-sm" style="width:100%;justify-content:center;margin-top:2px">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </div>
  </aside>

  <main class="main">

    <div class="topbar">
      <h1><i class="fas fa-briefcase" style="color:var(--sea);margin-right:6px"></i>Applications Dashboard</h1>
      <div class="topbar-actions">
        <a href="?export_csv=1&<?= buildQS() ?>" class="btn btn-sea"><i class="fas fa-download"></i> Export CSV</a>
        <a href="?bulk_zip=1&<?= buildQS() ?>"   class="btn btn-ghost"><i class="fas fa-file-archive"></i> Bulk CVs ZIP</a>
        <a href="logout.php" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-number" style="color:var(--sea)"><?= number_format((int)($stats['total'] ?? 0)) ?></div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--saffron)"><?= (int)($stats['today'] ?? 0) ?></div>
        <div class="stat-label">Applied Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-number"><?= (int)($stats['this_week'] ?? 0) ?></div>
        <div class="stat-label">This Week</div>
      </div>
    </div>

    <div class="filter-panel">
      <h3><i class="fas fa-filter" style="color:var(--sea);margin-right:6px"></i>Filter &amp; Search</h3>
      <form method="GET" action="hr_dashboard.php">
        <div class="filter-grid">
          <div class="fg">
            <label>Search (Name / Email / Phone)</label>
            <input type="text" name="search" value="<?= e($filterSearch) ?>" placeholder="Type to search…">
          </div>
          <div class="fg">
            <label>Post Applied For</label>
            <select name="post">
              <option value="">All Posts</option>
              <?php foreach ($posts as $p): ?>
              <option value="<?= e($p) ?>" <?= $filterPost === $p ? 'selected' : '' ?>><?= e($p) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="fg">
            <label>Min Experience (Yrs)</label>
            <input type="number" name="exp_min" min="0" value="<?= $filterExpMin ?? '' ?>" placeholder="e.g. 2">
          </div>
          <div class="fg">
            <label>Max Experience (Yrs)</label>
            <input type="number" name="exp_max" min="0" value="<?= $filterExpMax ?? '' ?>" placeholder="e.g. 10">
          </div>
          <div class="fg">
            <label>Qualification keyword</label>
            <input type="text" name="qual" value="<?= e($filterQual) ?>" placeholder="e.g. MBBS, B.Sc">
          </div>
          <div class="fg">
            <label>Applied From</label>
            <input type="date" name="date_from" value="<?= e($filterDateFrom) ?>">
          </div>
          <div class="fg">
            <label>Applied To</label>
            <input type="date" name="date_to" value="<?= e($filterDateTo) ?>">
          </div>
        </div>
        <div class="filter-actions">
          <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Apply Filters</button>
          <a href="hr_dashboard.php" class="btn btn-ghost"><i class="fas fa-times"></i> Clear All</a>
        </div>
      </form>
    </div>

    <div class="table-wrap">
      <div class="table-header">
        <span class="result-count">
          Showing <strong><?= count($applications) ?></strong> of <strong><?= $totalRows ?></strong> application<?= $totalRows !== 1 ? 's' : '' ?>
          <?php if ($totalPages > 1): ?> &nbsp;·&nbsp; Page <?= $page ?> of <?= $totalPages ?><?php endif; ?>
        </span>
        <form method="POST" action="bulk_download.php" id="bulk-form" style="display:inline">
          <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">
          <button type="submit" name="action" value="zip_selected" class="btn btn-ghost btn-sm">
            <i class="fas fa-archive"></i> Download Selected CVs
          </button>
        </form>
      </div>

      <?php if (empty($applications)): ?>
      <div class="no-data">
        <i class="fas fa-folder-open"></i>
        No applications match these filters.<br>
        <a href="hr_dashboard.php" style="font-size:.88rem;margin-top:8px;display:inline-block">Clear all filters</a>
      </div>
      <?php else: ?>
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th class="check-col"><input type="checkbox" id="chk-all" onclick="toggleAll(this)" title="Select all"></th>
              <th>ID</th>
              <th>Applied On</th>
              <th>Applicant</th>
              <th>Post Applied For</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Exp.</th>
              <th>Qualification 1</th>
              <th>CV</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          <?php foreach ($applications as $app): ?>
            <tr>
              <td class="check-col">
                <input type="checkbox" name="app_ids[]" form="bulk-form" value="<?= (int)$app['id'] ?>">
              </td>
              
              <td style="color:var(--muted);font-size:.78rem"><?= (int)$app['id'] ?></td>
              <td style="white-space:nowrap;font-size:.8rem">
    <?= e($dt->format('d M Y')) ?><br>
    <span style="color:var(--muted)">
        <?= e($dt->format('h:i A')) ?>
    </span>
</td>
              <td>
                <strong><?= e($app['title'] . ' ' . $app['first_name'] . ' ' . $app['last_name']) ?></strong>
                <?php if (!empty($app['registration_no'])): ?>
                <br><span style="font-size:.75rem;color:var(--muted)">Reg: <?= e($app['registration_no']) ?></span>
                <?php endif; ?>
              </td>
              <td><span class="tag-badge"><?= e($app['post_applied_for']) ?></span></td>
              <td><?= e($app['contact_number']) ?></td>
              <td style="word-break:break-all;font-size:.8rem"><?= e($app['email_id']) ?></td>
              <td style="white-space:nowrap">
                <?php
                $expParts = [];
                if ($app['experience_years'] !== null)  $expParts[] = $app['experience_years'] . 'y';
                if ($app['experience_months'] !== null) $expParts[] = $app['experience_months'] . 'm';
                echo $expParts ? e(implode(' ', $expParts)) : '<span style="color:var(--muted)">—</span>';
                ?>
              </td>
              <td style="font-size:.8rem"><?= e($app['qualification_1'] ?? '—') ?></td>
              <td>
                <?php if (!empty($app['cv_file_path'])): ?>
                <a href="download_cv.php?id=<?= (int)$app['id'] ?>" class="btn btn-sea btn-sm">
                  <i class="fas fa-download"></i> CV
                </a>
                <?php else: ?>
                <span style="color:var(--muted);font-size:.77rem">—</span>
                <?php endif; ?>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm"
                  onclick='openModal(<?= json_encode($app, JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_TAG) ?>)'>
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>

      <?php if ($totalPages > 1): ?>
      <div class="pagination">
        <?php if ($page > 1): ?>
          <a href="?page=<?= $page-1 ?>&<?= buildQS() ?>" class="page-btn"><i class="fas fa-chevron-left"></i></a>
        <?php else: ?>
          <span class="page-btn disabled"><i class="fas fa-chevron-left"></i></span>
        <?php endif; ?>

        <?php for ($p = max(1,$page-2), $pEnd = min($totalPages,$page+2); $p <= $pEnd; $p++): ?>
          <a href="?page=<?= $p ?>&<?= buildQS() ?>" class="page-btn <?= $p===$page?'active':'' ?>"><?= $p ?></a>
        <?php endfor; ?>

        <?php if ($page < $totalPages): ?>
          <a href="?page=<?= $page+1 ?>&<?= buildQS() ?>" class="page-btn"><i class="fas fa-chevron-right"></i></a>
        <?php else: ?>
          <span class="page-btn disabled"><i class="fas fa-chevron-right"></i></span>
        <?php endif; ?>
      </div>
      <?php endif; ?>
      <?php endif; ?>
    </div>

  </main>
</div>

<!-- Modal -->
<div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-hdr">
      <div class="modal-title" id="modal-title">Application Detail</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div id="modal-body" class="detail-grid"></div>
  </div>
</div>

<script>
function toggleAll(m){document.querySelectorAll('input[name="app_ids[]"]').forEach(c=>c.checked=m.checked);}

function openModal(a){
  const f=v=>(v!==null&&v!==undefined&&v!=='')? String(v):'—';
  document.getElementById('modal-title').textContent='Application #'+a.id+' — '+f(a.title)+' '+f(a.first_name)+' '+f(a.last_name);

  const secs=[
    {h:'Basic Information',rows:[['Post Applied For',a.post_applied_for],['Applied On',a.applied_on],['Title',a.title],['First Name',a.first_name],['Middle Name',a.middle_name],['Last Name',a.last_name],['Date of Birth',a.date_of_birth],['Gender',a.gender],['Nationality',a.nationality],['Address',a.address]]},
    {h:'Contact Details',rows:[['Contact Number',a.contact_number],['Email Id',a.email_id],['Registration No.',a.registration_no]]},
    {h:'Qualifications',rows:[['Qualification 1',a.qualification_1],['Qualification 2',a.qualification_2],['Qualification 3',a.qualification_3],['Qualification 4',a.qualification_4]]},
    {h:'Job Details',rows:[['Preferred Location',a.preferred_location],['Experience (Years)',a.experience_years],['Experience (Months)',a.experience_months],['Current CTC (₹)',a.current_ctc],['Expected CTC (₹)',a.expected_ctc],['Current Designation',a.current_designation],['Current Company',a.current_company],['Notice Period (days)',a.notice_period]]},
  ];

  let html='';
  secs.forEach(s=>{
    html+=`<div class="sec-div">${s.h}</div>`;
    s.rows.forEach(([l,v])=>`<div class="di"><label>${l}</label><p>${f(v)}</p></div>`);
    s.rows.forEach(([l,v])=>{html+=`<div class="di"><label>${l}</label><p>${f(v)}</p></div>`;});
  });

  if(a.cv_file_path){
    html+=`<div class="sec-div">Document</div>
    <div class="di" style="grid-column:1/-1">
      <label>CV File</label><p>${f(a.cv_original_name)}</p>
      <a href="download_cv.php?id=${parseInt(a.id)}" class="btn btn-sea btn-sm" style="margin-top:7px;display:inline-flex">
        <i class="fas fa-download"></i>&nbsp;Download CV
      </a>
    </div>`;
  }

  document.getElementById('modal-body').innerHTML=html;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeModal(){
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
</script>
</body>
</html>
