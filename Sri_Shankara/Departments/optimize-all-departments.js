/**
 * Apply standardized department page layout to all HTML files in /Departments/
 */
const fs = require('fs');
const path = require('path');

const DEPT_DIR = __dirname;
const SKIP_FILES = new Set([
  'Designation_Span_Update_Marking_Sheet.html',
  'Preventive_Oncology 2.html',
  'optimize-all-departments.js'
]);

function buildHead(title, description) {
  const safeDesc = description.replace(/"/g, '&quot;').substring(0, 220);
  const safeTitle = title.replace(/</g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${safeDesc}">
    <title>${safeTitle} | Sri Shankara Cancer Hospital</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{'hospital-green':'#2E8B57','hospital-orange':'#FF4500'}}}};</script>
    <link rel="stylesheet" href="../header.css">
    <link rel="stylesheet" href="department-page.css">
    <link rel="stylesheet" href="../footer.css">
    <link rel="stylesheet" href="../footer-main.css">
    <link rel="stylesheet" href="../chatbox.css">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-9EM0LW3CT3"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9EM0LW3CT3');</script>
</head>
<body class="bg-gray-50">
    <header id="dynamic-header"></header>
    <script src="../header.js"></script>

`;
}

function getTitle(original) {
  const m = original.match(/<title>([^<]*)<\/title>/i);
  let t = m ? m[1].trim() : 'Department';
  t = t.replace(/\s*\|\s*Sri Shankara.*$/i, '').trim();
  if (!/department|centre|center|care|oncology|medicine|pathology|therapy|services/i.test(t)) {
    if (!/department/i.test(t)) t += ' Department';
  }
  return t;
}

function breadcrumbLabel(title) {
  return title
    .replace(/\s+Department$/i, '')
    .replace(/\s+Centre$/i, '')
    .replace(/\s+Center$/i, '')
    .replace(/\s+Services$/i, '')
    .trim();
}

function extractTagline(html, deptTitle) {
  const m = html.match(/<p class="text-lg text-gray-700[^"]*">\s*([\s\S]*?)<\/p>/);
  if (m) {
    return m[1].replace(/<[^>]+>/g, '').trim().substring(0, 240);
  }
  const m2 = html.match(/<p class="text-xl text-gray-700[^"]*">\s*([\s\S]*?)<\/p>/);
  if (m2) {
    return m2[1].replace(/<[^>]+>/g, '').trim().substring(0, 240);
  }
  return `Expert ${breadcrumbLabel(deptTitle)} care delivered with compassion at Sri Shankara Cancer Hospital & Research Centre.`;
}

function buildPageHeader(title, tagline, hasDoctors, hasStrengths, hasServices) {
  const label = breadcrumbLabel(title);
  let jumps = '<a href="#overview" class="dept-jump-link"><i class="fas fa-info-circle" aria-hidden="true"></i> Overview</a>';
  if (hasServices) {
    jumps += '\n                <a href="#services" class="dept-jump-link"><i class="fas fa-procedures" aria-hidden="true"></i> Services</a>';
  }
  if (hasStrengths) {
    jumps += '\n                <a href="#strengths" class="dept-jump-link"><i class="fas fa-star" aria-hidden="true"></i> Why Us</a>';
  }
  if (hasDoctors) {
    jumps += '\n                <a href="#doctors" class="dept-jump-link"><i class="fas fa-user-md" aria-hidden="true"></i> Specialists</a>';
  }
  return `
    <div class="dept-breadcrumb-wrapper">
        <nav class="dept-breadcrumb" aria-label="Breadcrumb">
            <ol>
                <li><a href="../index.html">Home</a></li>
                <li><a href="../index.html">Departments</a></li>
                <li aria-current="page">${label}</li>
            </ol>
        </nav>
    </div>

    <div class="dept-page-header">
        <div class="dept-page-header-inner">
            <h1>${title}</h1>
            <p class="dept-tagline">${tagline}</p>
            <nav class="dept-jump-nav" aria-label="Page sections">
                ${jumps}
            </nav>
        </div>
    </div>
`;
}

function convertSpecialtyCards(html) {
  if (html.includes('specialty-card')) return html;
  const marker = 'border-l-4" style="border-color:';
  if (!html.includes(marker)) return html;

  return html.replace(
    /<div class="card-shadow rounded-xl p-6 bg-white border-l-4" style="border-color: ([^"]+);">\s*<div class="flex items-center mb-4">([\s\S]*?)<\/div>\s*<div class="text-gray-700 text-sm space-y-2">([\s\S]*?)<\/div>\s*<\/div>/g,
    (m, color, header, body) => `<details class="specialty-card card-shadow bg-white border-l-4" style="border-color: ${color};">
                    <summary class="specialty-card-summary">
                        <div class="flex items-center flex-1 gap-3">${header}</div>
                        <i class="fas fa-chevron-down specialty-chevron" aria-hidden="true"></i>
                    </summary>
                    <div class="specialty-card-body text-gray-700 text-sm space-y-2">${body}</div>
                </details>`
  );
}

function convertMissionCards(html) {
  const pairs = [
    ['from-green-50', '#2E8B57', 'fa-search'],
    ['from-orange-50', '#FF4500', 'fa-cut'],
    ['from-blue-50', '#1e40af', 'fa-heart']
  ];
  let out = html.replace('<div class="grid md:grid-cols-3 gap-6 mt-8">', '<div class="dept-mission-grid mt-8">');
  pairs.forEach(([grad, bg, icon]) => {
    const re = new RegExp(
      `<div class="card-shadow rounded-xl p-6 bg-gradient-to-br ${grad} to-white">\\s*<div class="w-12 h-12 rounded-full flex items-center justify-center mb-4" style="background: ${bg.replace('#', '\\#')};">\\s*<i class="fas [^"]+"><\\/i>\\s*<\\/div>`,
      'i'
    );
    out = out.replace(
      re,
      `<div class="dept-mission-card card-hover"><div class="dept-mission-icon" style="background:${bg};"><i class="fas ${icon}"></i></div>`
    );
  });
  return out;
}

function replaceCarouselScript(html) {
  if (!html.includes('// Carousel functionality')) return html;
  if (html.includes('department-carousel.js')) {
    const idx = html.indexOf('// Carousel functionality');
    if (idx === -1) return html;
    const start = html.lastIndexOf('<script', idx);
    const end = html.indexOf('</script>', idx) + 9;
    if (start !== -1 && end > start) {
      html = html.slice(0, start) + '    <script src="department-carousel.js"></script>\n' + html.slice(end);
    }
    return html;
  }
  const idx = html.indexOf('// Carousel functionality');
  const start = html.lastIndexOf('<script', idx);
  const end = html.indexOf('</script>', idx) + 9;
  if (start === -1 || end <= start) return html;
  return html.slice(0, start) + '    <script src="department-carousel.js"></script>\n\n' + html.slice(end);
}

function upgradeSections(html) {
  const hasDoctors = /id=["']doctors["']/i.test(html);
  const hasStrengths = /Why Choose/i.test(html);
  const sectionCount = (html.match(/<section/gi) || []).length;
  const hasServices = sectionCount >= 2;

  let out = html;
  let overviewDone = false;
  let servicesDone = false;

  out = out.replace(/<section([^>]*)>/gi, (full, attrs) => {
    if (/id=["']doctors["']/i.test(attrs)) {
      return '<section id="doctors" class="dept-section dept-section-alt scroll-mt-24">';
    }
    if (/id=["']overview["']/i.test(attrs)) return full;
    if (/id=["']services["']/i.test(attrs)) return full;
    if (/id=["']strengths["']/i.test(attrs)) return full;

    const chunk = out.substring(out.indexOf(full), out.indexOf(full) + 800);
    if (/Why Choose/i.test(chunk)) {
      return '<section id="strengths" class="dept-section bg-white scroll-mt-24">';
    }

    if (!overviewDone && /py-20 bg-white|dept-section bg-white/i.test(attrs)) {
      overviewDone = true;
      return '<section id="overview" class="dept-section bg-white scroll-mt-24">';
    }
    if (!servicesDone && /py-20 bg-gray-50|dept-section-alt/i.test(attrs)) {
      servicesDone = true;
      return '<section id="services" class="dept-section dept-section-alt scroll-mt-24">';
    }
    if (/py-20 bg-white/.test(attrs)) {
      return '<section class="dept-section bg-white scroll-mt-24">';
    }
    if (/py-20 bg-gray-50/.test(attrs)) {
      return '<section class="dept-section dept-section-alt scroll-mt-24">';
    }
    if (/py-20 bg-gradient-to-br/.test(attrs)) {
      return '<section class="dept-section dept-section-alt scroll-mt-24">';
    }
    return full;
  });

  return { html: out, hasDoctors, hasStrengths, hasServices };
}

function ensureChatbox(html) {
  if (html.includes('../chatbox.js')) return html;
  return html.replace(
    /<script src="\.\.\/footer-main\.js"><\/script>/,
    '<script src="../footer-main.js"></script>\n    <script src="../chatbox.js"></script>'
  );
}

function optimizeFile(filename) {
  if (!filename.endsWith('.html') || SKIP_FILES.has(filename)) {
    return { file: filename, status: 'skipped' };
  }

  const filePath = path.join(DEPT_DIR, filename);
  let original = fs.readFileSync(filePath, 'utf8');

  if (original.includes('dept-page-header') && original.includes('department-page.css')) {
    return { file: filename, status: 'already-optimized' };
  }

  const title = getTitle(original);
  const description = extractTagline(original, title);

  const bannerIdx = original.indexOf('<!-- Banner Section');
  if (bannerIdx === -1) {
    return { file: filename, status: 'no-banner' };
  }

  let html = buildHead(title, description) + original.slice(bannerIdx);

  html = html.replace(/alt="Hospital Desktop Background"/g, `alt="${title}"`);
  html = html.replace(/alt="Hospital Mobile Background"/g, `alt="${title}"`);

  const sectionResult = upgradeSections(html);
  html = sectionResult.html;

  html = convertMissionCards(html);
  html = convertSpecialtyCards(html);

  if (html.includes('Cancers We Treat:')) {
    html = html.replace(
      '<h3 class="text-3xl font-bold text-gray-900 mb-8 text-center">Cancers We Treat:</h3>',
      '<h3 class="text-2xl font-bold text-gray-900 mb-3 text-center">Cancers We Treat</h3>\n                <p class="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Tap a specialty to view procedures and services offered.</p>'
    );
    html = html.replace(
      '<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">',
      '<div class="specialty-grid grid md:grid-cols-2 lg:grid-cols-3 gap-4">'
    );
  }

  html = replaceCarouselScript(html);
  html = ensureChatbox(html);

  if (!html.includes('dept-page-header')) {
    const header = buildPageHeader(
      title,
      description,
      sectionResult.hasDoctors,
      sectionResult.hasStrengths,
      sectionResult.hasServices
    );
    html = html.replace(
      /(\s*<\/div>\s*\n)(\s*<!-- Section)/,
      '$1' + header + '\n$2'
    );
  }

  fs.writeFileSync(filePath, html);
  return { file: filename, status: 'optimized', lines: html.split('\n').length };
}

const files = fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith('.html'));
const results = files.map(optimizeFile);

const optimized = results.filter((r) => r.status === 'optimized');
const skipped = results.filter((r) => r.status !== 'optimized');

console.log('Optimized:', optimized.length);
optimized.forEach((r) => console.log('  +', r.file, '(' + r.lines + ' lines)'));
console.log('Skipped/other:', skipped.length);
skipped.forEach((r) => console.log('  -', r.file, r.status));
