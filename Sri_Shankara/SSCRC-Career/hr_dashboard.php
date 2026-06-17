<?php
/**
 * hr_dashboard.php — HR Admin Dashboard
 * Sri Shankara Cancer Hospital Career Portal
 */

declare(strict_types=1);
require_once '/home/az5v0bah4rbd/db_config.php';

requireHrLogin();

$pdo = getDBConnection();

// ── Gather filter inputs ──────────────────────────────────────────────────────
$filterPost     = clean($_GET['post']        ?? '');
$filterExpMin   = isset($_GET['exp_min'])  && $_GET['exp_min'] !== '' ? (int)$_GET['exp_min'] : null;
$filterExpMax   = isset($_GET['exp_max'])  && $_GET['exp_max'] !== '' ? (int)$_GET['exp_max'] : null;
$filterQual     = clean($_GET['qual']        ?? '');
$filterDateFrom = clean($_GET['date_from']   ?? '');
$filterDateTo   = clean($_GET['date_to']     ?? '');
$filterSearch   = clean($_GET['search']      ?? '');
$page           = max(1, (int)($_GET['page'] ?? 1));
$perPage        = 20;
$offset         = 0;

function clean(string $v): string { return trim(strip_tags($v)); }

function buildFullName(array $row): string
{
    $parts = array_filter([
        trim((string)($row['title'] ?? '')),
        trim((string)($row['first_name'] ?? '')),
        trim((string)($row['middle_name'] ?? '')),
        trim((string)($row['last_name'] ?? '')),
    ], static fn($v) => $v !== '');

    return preg_replace('/\s+/', ' ', implode(' ', $parts)) ?? '';
}

// ── Build WHERE clause ────────────────────────────────────────────────────────
$where  = [];
$params = [];

if ($filterPost !== '') {
    $where[]                 = 'post_applied_for = :post';
    $params[':post']         = $filterPost;
}
if ($filterExpMin !== null) {
    $where[]                 = 'experience_years >= :exp_min';
    $params[':exp_min']      = $filterExpMin;
}
if ($filterExpMax !== null) {
    $where[]                 = 'experience_years <= :exp_max';
    $params[':exp_max']      = $filterExpMax;
}
if ($filterQual !== '') {
    $where[]                 = '(qualification_1 LIKE :qual OR qualification_2 LIKE :qual OR qualification_3 LIKE :qual OR qualification_4 LIKE :qual)';
    $params[':qual']         = '%' . $filterQual . '%';
}
if ($filterDateFrom !== '') {
    $where[]                 = 'DATE(applied_on) >= :date_from';
    $params[':date_from']    = $filterDateFrom;
}
if ($filterDateTo !== '') {
    $where[]                 = 'DATE(applied_on) <= :date_to';
    $params[':date_to']      = $filterDateTo;
}
if ($filterSearch !== '') {
    $where[]                 = "(first_name LIKE :s OR middle_name LIKE :s OR last_name LIKE :s OR email_id LIKE :s OR contact_number LIKE :s OR CONCAT_WS(' ', first_name, middle_name, last_name) LIKE :s)";
    $params[':s']            = '%' . $filterSearch . '%';
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// ── Count total ───────────────────────────────────────────────────────────────
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM job_applications $whereSQL");
$countStmt->execute($params);
$totalRows = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($totalRows / $perPage));
$page = min($page, $totalPages);
$offset = ($page - 1) * $perPage;

// ── Fetch rows ────────────────────────────────────────────────────────────────
$dataStmt = $pdo->prepare("SELECT * FROM job_applications $whereSQL ORDER BY applied_on DESC LIMIT :limit OFFSET :offset");
foreach ($params as $k => $v) {
    $dataStmt->bindValue($k, $v);
}
$dataStmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$dataStmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$dataStmt->execute();
$applications = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
$applicationsJson = json_encode(
    $applications,
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE
);
if ($applicationsJson === false) {
    $applicationsJson = '[]';
}

// ── Distinct posts for filter dropdown ────────────────────────────────────────
$posts = $pdo->query("SELECT DISTINCT post_applied_for FROM job_applications ORDER BY post_applied_for ASC")->fetchAll(PDO::FETCH_COLUMN);

// ── Stats ────────────────────────────────────────────────────────────────────
$stats = $pdo->query("SELECT COUNT(*) AS total,
    SUM(CASE WHEN DATE(applied_on) = CURDATE() THEN 1 ELSE 0 END) AS today,
    SUM(CASE WHEN DATE(applied_on) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS this_week
    FROM job_applications")->fetch();

$csrf = generateCsrfToken();

// ── CSV Export ────────────────────────────────────────────────────────────────
if (isset($_GET['export_csv']) && $_GET['export_csv'] === '1') {
    $exportStmt = $pdo->prepare("SELECT * FROM job_applications $whereSQL ORDER BY applied_on DESC");
    $exportStmt->execute($params);
    $rows = $exportStmt->fetchAll();

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="applications_' . date('Ymd_His') . '.csv"');
    header('Pragma: no-cache');
    echo "\xEF\xBB\xBF"; // BOM for Excel UTF-8

    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID','Post Applied For','Applied On','Title','First Name','Middle Name','Last Name',
        'DOB','Address','Nationality','Gender','Contact','Email','Reg No',
        'Qualification 1','Qualification 2','Qualification 3','Qualification 4',
        'Preferred Location','Exp Years','Exp Months','Current CTC','Expected CTC',
        'Current Designation','Current Company','Notice Period','CV File']);
    foreach ($rows as $r) {
        fputcsv($out, [
            $r['id'],$r['post_applied_for'],$r['applied_on'],$r['title'],
            $r['first_name'],$r['middle_name'],$r['last_name'],
            $r['date_of_birth'],$r['address'],$r['nationality'],$r['gender'],
            $r['contact_number'],$r['email_id'],$r['registration_no'],
            $r['qualification_1'],$r['qualification_2'],$r['qualification_3'],$r['qualification_4'],
            $r['preferred_location'],$r['experience_years'],$r['experience_months'],
            $r['current_ctc'],$r['expected_ctc'],
            $r['current_designation'],$r['current_company'],$r['notice_period'],
            $r['cv_original_name'],
        ]);
    }
    fclose($out);
    exit;
}

// Build query string (without page/export)
function buildQS(array $extra = []): string
{
    $params = array_merge($_GET, $extra);
    unset($params['page'], $params['export_csv'], $params['bulk_zip']);
    return http_build_query(array_filter($params, fn($v) => $v !== ''));
}
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
:root{--sea:#2e8b57;--sea-600:#27724a;--sea-50:#f0fbf6;--sea-100:#cce8d8;--saffron:#ff8c1a;--saffron-600:#d97312;--saffron-50:#fff7f0;--ink:#1f2937;--ink-light:#4b5563;--muted:#6b7280;--bg:#f8fafc;--card:#fff;--border:#e5e7eb;--shadow:0 2px 8px rgba(0,0,0,.07);--radius:12px}
body{font-family:Inter,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh}
a{color:var(--sea);text-decoration:none}
a:hover{color:var(--saffron)}

/* Sidebar */
.layout{display:flex;min-height:100vh}
.sidebar{width:240px;background:var(--ink);flex-shrink:0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-logo{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
.sidebar-logo .name{color:#fff;font-weight:800;font-size:1rem;line-height:1.3}
.sidebar-logo .sub{color:rgba(255,255,255,.5);font-size:.78rem;margin-top:2px}
.sidebar-nav{padding:16px 12px;flex:1}
.nav-label{color:rgba(255,255,255,.35);font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 8px 4px;margin-top:12px}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:rgba(255,255,255,.7);font-size:.9rem;font-weight:500;cursor:pointer;transition:.2s;margin-bottom:2px}
.nav-item:hover,.nav-item.active{background:rgba(255,255,255,.1);color:#fff}
.nav-item i{width:18px;text-align:center;font-size:.85rem}
.sidebar-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.1)}
.sidebar-user{color:rgba(255,255,255,.7);font-size:.85rem}
.sidebar-user strong{display:block;color:#fff;font-size:.9rem}

/* Main */
.main{flex:1;overflow-x:auto}
.topbar{background:#fff;border-bottom:1px solid var(--border);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;position:sticky;top:0;z-index:10}
.topbar h1{font-size:1.25rem;font-weight:800;color:var(--ink)}
.topbar-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-weight:600;font-size:.875rem;border:none;cursor:pointer;transition:.2s;text-decoration:none}
.btn-primary{background:var(--saffron);color:#fff}
.btn-primary:hover{background:var(--saffron-600)}
.btn-sea{background:var(--sea);color:#fff}
.btn-sea:hover{background:var(--sea-600)}
.btn-ghost{background:#fff;color:var(--ink-light);border:1px solid var(--border)}
.btn-ghost:hover{background:#f9fafb;color:var(--ink)}
.btn-danger{background:#fee2e2;color:#dc2626;border:1px solid #fecaca}
.btn-danger:hover{background:#fecaca}
.btn-sm{padding:6px 12px;font-size:.8rem}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px 28px 0}
.stat-card{background:var(--card);border-radius:var(--radius);padding:20px 24px;border:1px solid var(--border);box-shadow:var(--shadow)}
.stat-number{font-size:2rem;font-weight:800;color:var(--ink);line-height:1}
.stat-label{color:var(--muted);font-size:.85rem;margin-top:4px}
.stat-accent{color:var(--sea)}

/* Filter panel */
.filter-panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin:20px 28px 0;box-shadow:var(--shadow)}
.filter-panel h3{font-size:.9rem;font-weight:700;color:var(--ink);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.filter-group label{display:block;font-size:.78rem;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
.filter-group input,.filter-group select{width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:.875rem;font-family:Inter,sans-serif;color:var(--ink);background:#fafafa}
.filter-group input:focus,.filter-group select:focus{outline:none;border-color:var(--sea);background:#fff}
.filter-actions{display:flex;gap:8px;margin-top:14px;align-items:center;flex-wrap:wrap}

/* Table */
.table-wrap{margin:16px 28px 24px;background:var(--card);border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow);overflow:hidden}
.table-header{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.result-count{font-size:.875rem;color:var(--muted)}
.table-actions{display:flex;gap:8px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;font-size:.875rem}
thead{background:#f9fafb}
th{padding:11px 14px;text-align:left;font-weight:700;font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:12px 14px;border-bottom:1px solid #f3f4f6;vertical-align:middle;color:var(--ink)}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.check-col{width:40px;text-align:center}
input[type=checkbox]{cursor:pointer;accent-color:var(--sea)}
.badge-tag{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.78rem;font-weight:600;background:var(--sea-50);color:var(--sea);border:1px solid var(--sea-100)}
.no-data{padding:48px;text-align:center;color:var(--muted)}
.no-data i{font-size:2.5rem;display:block;margin-bottom:12px;opacity:.4}

/* Pagination */
.pagination{display:flex;align-items:center;justify-content:center;gap:6px;padding:20px}
.page-btn{padding:7px 12px;border-radius:8px;border:1px solid var(--border);color:var(--ink-light);cursor:pointer;font-size:.85rem;background:#fff;transition:.15s;text-decoration:none}
.page-btn:hover,.page-btn.active{background:var(--sea);color:#fff;border-color:var(--sea)}
.page-btn.disabled{opacity:.4;pointer-events:none}

/* Modal */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;padding:20px}
.modal-overlay.open{display:flex}
.modal{background:#fff;border-radius:16px;padding:32px;max-width:720px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.modal-title{font-size:1.2rem;font-weight:800;color:var(--ink)}
.modal-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted);padding:4px}
.modal-close:hover{color:var(--ink)}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.detail-item label{display:block;font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
.detail-item p{color:var(--ink);font-size:.9rem}
.section-divider{grid-column:1/-1;border-top:1px solid var(--border);padding-top:12px;margin-top:4px;font-weight:700;font-size:.85rem;color:var(--sea);text-transform:uppercase;letter-spacing:.06em}

@media(max-width:900px){
  .sidebar{display:none}
  .stats-row{grid-template-columns:1fr 1fr}
  .detail-grid{grid-template-columns:1fr}
}
@media(max-width:600px){
  .stats-row{grid-template-columns:1fr}
  .filter-grid{grid-template-columns:1fr 1fr}
  .topbar{flex-direction:column;align-items:flex-start}
}
</style>
</head>
<body>
<div class="layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="name">Sri Shankara</div>
      <div class="sub">HR Career Portal</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">Menu</div>
      <div class="nav-item active"><i class="fas fa-users"></i> Applications</div>
      <a href="?export_csv=1&<?= buildQS() ?>" class="nav-item"><i class="fas fa-file-csv"></i> Export CSV</a>
      <a href="?bulk_zip=1&<?= buildQS() ?>" class="nav-item"><i class="fas fa-file-archive"></i> Bulk Download CVs</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <strong><?= e($_SESSION['hr_name'] ?? 'HR User') ?></strong>
        Logged in
      </div>
      <a href="logout.php" class="btn btn-danger btn-sm" style="margin-top:12px;width:100%;justify-content:center">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </div>
  </aside>

  <!-- Main -->
  <main class="main">
    <!-- Topbar -->
    <div class="topbar">
      <h1><i class="fas fa-briefcase" style="color:var(--sea);margin-right:8px"></i>Applications Dashboard</h1>
      <div class="topbar-actions">
        <a href="?export_csv=1&<?= buildQS() ?>" class="btn btn-sea">
          <i class="fas fa-download"></i> Export CSV
        </a>
        <a href="?bulk_zip=1&<?= buildQS() ?>" class="btn btn-ghost">
          <i class="fas fa-file-archive"></i> Bulk CVs
        </a>
        <a href="logout.php" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-number stat-accent"><?= number_format((int)$stats['total']) ?></div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--saffron)"><?= (int)$stats['today'] ?></div>
        <div class="stat-label">Applied Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-number"><?= (int)$stats['this_week'] ?></div>
        <div class="stat-label">This Week</div>
      </div>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel">
      <h3><i class="fas fa-filter"></i> Filter &amp; Search</h3>
      <form method="GET" action="hr_dashboard.php">
        <div class="filter-grid">
          <div class="filter-group">
            <label>Search (Name/Email/Phone)</label>
            <input type="text" name="search" value="<?= e($filterSearch) ?>" placeholder="Search…">
          </div>
          <div class="filter-group">
            <label>Post Applied For</label>
            <select name="post">
              <option value="">All Posts</option>
              <?php foreach ($posts as $p): ?>
              <option value="<?= e($p) ?>" <?= $filterPost === $p ? 'selected' : '' ?>><?= e($p) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="filter-group">
            <label>Min Experience (Years)</label>
            <input type="number" name="exp_min" min="0" value="<?= $filterExpMin ?? '' ?>" placeholder="e.g. 2">
          </div>
          <div class="filter-group">
            <label>Max Experience (Years)</label>
            <input type="number" name="exp_max" min="0" value="<?= $filterExpMax ?? '' ?>" placeholder="e.g. 10">
          </div>
          <div class="filter-group">
            <label>Qualification (keyword)</label>
            <input type="text" name="qual" value="<?= e($filterQual) ?>" placeholder="e.g. MBBS, B.Sc">
          </div>
          <div class="filter-group">
            <label>Applied From</label>
            <input type="date" name="date_from" value="<?= e($filterDateFrom) ?>">
          </div>
          <div class="filter-group">
            <label>Applied To</label>
            <input type="date" name="date_to" value="<?= e($filterDateTo) ?>">
          </div>
        </div>
        <div class="filter-actions">
          <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Apply Filters</button>
          <a href="hr_dashboard.php" class="btn btn-ghost"><i class="fas fa-times"></i> Clear</a>
        </div>
      </form>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-header">
        <div class="result-count">
          Showing <strong><?= count($applications) ?></strong> of <strong><?= $totalRows ?></strong> results
          <?php if ($totalRows > 0): ?>
          (Page <?= $page ?> of <?= $totalPages ?>)
          <?php endif; ?>
        </div>
        <div class="table-actions">
          <form method="POST" action="bulk_download.php" id="bulk-form">
            <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">
            <button type="submit" name="action" value="zip_selected" class="btn btn-ghost btn-sm">
              <i class="fas fa-archive"></i> Download Selected CVs
            </button>
          </form>
        </div>
      </div>

      <?php if (empty($applications)): ?>
      <div class="no-data">
        <i class="fas fa-folder-open"></i>
        No applications found. Try adjusting your filters.
      </div>
      <?php else: ?>
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th class="check-col"><input type="checkbox" id="chk-all" onclick="toggleAll(this)"></th>
              <th>#</th>
              <th>Applied On</th>
              <th>Name</th>
              <th>Post Applied For</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Experience</th>
              <th>Qualification</th>
              <th>CV</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          <?php foreach ($applications as $i => $app): ?>
            <tr>
              <td class="check-col">
                <input type="checkbox" name="app_ids[]" form="bulk-form" value="<?= (int)$app['id'] ?>">
              </td>
              <td><?= (int)$app['id'] ?></td>
              <td style="white-space:nowrap"><?= e(date('d M Y', strtotime($app['applied_on']))) ?><br>
                  <small style="color:var(--muted)"><?= e(date('h:i A', strtotime($app['applied_on']))) ?></small></td>
              <td>
                <strong><?= e(buildFullName($app)) ?></strong>
                <?php if ($app['registration_no']): ?>
                <br><small style="color:var(--muted)">Reg: <?= e($app['registration_no']) ?></small>
                <?php endif; ?>
              </td>
              <td><span class="badge-tag"><?= e($app['post_applied_for']) ?></span></td>
              <td><?= e($app['contact_number']) ?></td>
              <td style="word-break:break-all"><?= e($app['email_id']) ?></td>
              <td style="white-space:nowrap">
                <?= $app['experience_years'] !== null ? e($app['experience_years']) . 'y' : '—' ?>
                <?= $app['experience_months'] !== null ? ' ' . e($app['experience_months']) . 'm' : '' ?>
              </td>
              <td><?= e($app['qualification_1'] ?? '—') ?></td>
              <td>
                <?php if ($app['cv_file_path']): ?>
                <a href="download_cv.php?id=<?= (int)$app['id'] ?>" class="btn btn-sea btn-sm">
                  <i class="fas fa-download"></i> CV
                </a>
                <?php else: ?>
                <span style="color:var(--muted);font-size:.8rem">—</span>
                <?php endif; ?>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="openModalById(<?= (int)$app['id'] ?>)">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <?php if ($totalPages > 1): ?>
      <div class="pagination">
        <?php if ($page > 1): ?>
        <a href="?page=<?= $page-1 ?>&<?= buildQS() ?>" class="page-btn"><i class="fas fa-chevron-left"></i></a>
        <?php else: ?>
        <span class="page-btn disabled"><i class="fas fa-chevron-left"></i></span>
        <?php endif; ?>

        <?php
        $start = max(1, $page - 2);
        $end   = min($totalPages, $page + 2);
        for ($p = $start; $p <= $end; $p++): ?>
        <a href="?page=<?= $p ?>&<?= buildQS() ?>" class="page-btn <?= $p === $page ? 'active' : '' ?>"><?= $p ?></a>
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

<!-- Detail Modal -->
<div class="modal-overlay" id="modal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="modal-title">Application Detail</div>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <div id="modal-body" class="detail-grid"></div>
  </div>
</div>

<script>
const applicationRows = <?= $applicationsJson ?>;
const applicationMap = Object.fromEntries(applicationRows.map(app => [String(app.id), app]));

function toggleAll(master) {
  document.querySelectorAll('input[name="app_ids[]"]').forEach(cb => cb.checked = master.checked);
}

function openModalById(id) {
  const app = applicationMap[String(id)];
  if (!app) return;
  openModal(app);
}

function openModal(app) {
  const fmt = (v) => v !== null && v !== '' && v !== undefined ? v : '—';
  const fullName = [app.title, app.first_name, app.middle_name, app.last_name]
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  document.getElementById('modal-title').textContent =
    'Application #' + app.id + ' — ' + fullName;

  const fields = [
    ['section', 'Basic Information'],
    ['Post Applied For', app.post_applied_for],
    ['Applied On', app.applied_on],
    ['Title', app.title],
    ['First Name', app.first_name],
    ['Middle Name', app.middle_name],
    ['Last Name', app.last_name],
    ['Date of Birth', app.date_of_birth],
    ['Gender', app.gender],
    ['Nationality', app.nationality],
    ['Address', app.address],
    ['section', 'Contact Details'],
    ['Contact Number', app.contact_number],
    ['Email Id', app.email_id],
    ['Registration No.', app.registration_no],
    ['section', 'Qualifications'],
    ['Qualification 1', app.qualification_1],
    ['Qualification 2', app.qualification_2],
    ['Qualification 3', app.qualification_3],
    ['Qualification 4', app.qualification_4],
    ['section', 'Job Details'],
    ['Preferred Location', app.preferred_location],
    ['Experience (Years)', app.experience_years],
    ['Experience (Months)', app.experience_months],
    ['Current CTC', app.current_ctc],
    ['Expected CTC', app.expected_ctc],
    ['Current Designation', app.current_designation],
    ['Current Company', app.current_company],
    ['Notice Period (days)', app.notice_period],
    ['section', 'Document'],
    ['CV File', app.cv_original_name],
  ];

  let html = '';
  fields.forEach(([label, val]) => {
    if (label === 'section') {
      html += `<div class="section-divider">${val}</div>`;
    } else {
      html += `<div class="detail-item"><label>${label}</label><p>${fmt(val)}</p></div>`;
    }
  });

  if (app.cv_file_path) {
    html += `<div class="detail-item" style="grid-column:1/-1">
      <a href="download_cv.php?id=${app.id}" class="btn btn-sea" style="margin-top:8px">
        <i class="fas fa-download"></i> Download CV (${app.cv_original_name || 'file'})
      </a>
    </div>`;
  }

  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
</script>
</body>
</html>
<?php
// ── Bulk ZIP download ─────────────────────────────────────────────────────────
if (isset($_GET['bulk_zip']) && $_GET['bulk_zip'] === '1') {
    // Re-query with filters for zip
    $zipStmt = $pdo->prepare("SELECT id, cv_file_path, cv_original_name, first_name, last_name FROM job_applications $whereSQL ORDER BY applied_on DESC");
    $zipStmt->execute($params);
    $zipRows = $zipStmt->fetchAll();

    if (empty($zipRows)) {
        die('No CVs found for the current filter.');
    }

    $zipFile = sys_get_temp_dir() . '/cvs_' . date('Ymd_His') . '.zip';
    $zip = new ZipArchive();
    if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
        die('Could not create ZIP archive.');
    }
    foreach ($zipRows as $r) {
        if ($r['cv_file_path']) {
            $fullPath = __DIR__ . $r['cv_file_path'];
            if (file_exists($fullPath)) {
                $safeName = 'CV_' . $r['id'] . '_' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $r['first_name'] . '_' . $r['last_name']) . '_' . basename($r['cv_file_path']);
                $zip->addFile($fullPath, $safeName);
            }
        }
    }
    $zip->close();

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="CVs_' . date('Ymd_His') . '.zip"');
    header('Content-Length: ' . filesize($zipFile));
    readfile($zipFile);
    unlink($zipFile);
    exit;
}
