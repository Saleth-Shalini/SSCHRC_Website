(function () {
    'use strict';

    var PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    var PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var MAMMOTH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

    var QUALIFICATION_PATTERNS = [
        'M.Ch.', 'M.Ch', 'MBBS', 'MDS', 'BDS', 'MBBS', 'MD', 'MS', 'DM', 'DNB', 'M.Sc', 'M.Sc.', 'B.Sc', 'B.Sc.',
        'Ph.D', 'PhD', 'GNM', 'B.Pharm', 'M.Pharm', 'BPT', 'MPT', 'MBA', 'MCA', 'B.Tech', 'M.Tech', 'B.Com', 'M.Com',
        'B.Sc Nursing', 'M.Sc Nursing', 'Post Basic B.Sc Nursing'
    ];

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function ensurePdfJs() {
        return loadScript(PDFJS_CDN).then(function () {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            }
        });
    }

    function ensureMammoth() {
        return loadScript(MAMMOTH_CDN);
    }

    function getExt(file) {
        var parts = file.name.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    async function extractPdfText(file) {
        await ensurePdfJs();
        if (!window.pdfjsLib) throw new Error('PDF reader failed to load.');
        var buffer = await file.arrayBuffer();
        var pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        var chunks = [];
        for (var p = 1; p <= pdf.numPages; p++) {
            var page = await pdf.getPage(p);
            var content = await page.getTextContent();
            chunks.push(content.items.map(function (item) { return item.str; }).join(' '));
        }
        return chunks.join('\n');
    }

    async function extractDocxText(file) {
        await ensureMammoth();
        if (!window.mammoth) throw new Error('DOCX reader failed to load.');
        var buffer = await file.arrayBuffer();
        var result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value || '';
    }

    async function extractResumeText(file) {
        var ext = getExt(file);
        if (ext === 'pdf') return extractPdfText(file);
        if (ext === 'docx') return extractDocxText(file);
        if (ext === 'doc') {
            throw new Error('Legacy .doc files cannot be read in the browser. Please save as PDF or DOCX.');
        }
        throw new Error('Unsupported file type. Use PDF or DOCX.');
    }

    function setFieldValue(id, value, onlyIfEmpty) {
        var el = document.getElementById(id);
        if (!el || value == null || String(value).trim() === '') return false;
        if (onlyIfEmpty && el.value && el.value.trim() !== '') return false;
        el.value = String(value).trim();
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function setSelectByMatch(selectId, searchText, onlyIfEmpty) {
        var sel = document.getElementById(selectId);
        if (!sel || !searchText) return false;
        if (onlyIfEmpty && sel.value && sel.value.trim() !== '') return false;
        var norm = searchText.toLowerCase().replace(/\s+/g, ' ').trim();
        var matched = null;
        Array.prototype.forEach.call(sel.options, function (opt) {
            if (!opt.value) return;
            var label = opt.textContent.toLowerCase().trim();
            if (label === norm || label.indexOf(norm) !== -1 || norm.indexOf(label) !== -1) {
                if (!matched || label.length < matched.label.length) {
                    matched = { value: opt.value, label: label };
                }
            }
        });
        if (matched) {
            sel.value = matched.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }

    function parseName(fullName) {
        var cleaned = fullName.replace(/^(mr\.?|mrs\.?|ms\.?|miss\.?|dr\.?|prof\.?)\s+/i, '').trim();
        var parts = cleaned.split(/\s+/).filter(Boolean);
        if (!parts.length) return null;
        if (parts.length === 1) return { first: parts[0], middle: '', last: parts[0] };
        if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
        return {
            first: parts[0],
            middle: parts.slice(1, -1).join(' '),
            last: parts[parts.length - 1]
        };
    }

    function extractFieldsFromText(text) {
        var data = {};
        var normalized = text.replace(/\r/g, '\n');
        var flat = normalized.replace(/\s+/g, ' ');

        var emailMatch = flat.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) data.email_id = emailMatch[0];

        var phoneMatch = flat.match(/(?:\+91[\s\-]?)?([6-9]\d{9})\b/);
        if (phoneMatch) data.contact_number = phoneMatch[1];

        var lines = normalized.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
        var nameLine = '';
        for (var i = 0; i < Math.min(12, lines.length); i++) {
            var line = lines[i];
            if (/@/.test(line) || /\d{5,}/.test(line)) continue;
            if (/^(curriculum vitae|resume|cv|profile summary|professional summary|objective|experience|education|skills)/i.test(line)) continue;
            if (/^[A-Za-z][A-Za-z.'\-]{1,40}(?:\s+[A-Za-z][A-Za-z.'\-]{1,40}){1,4}$/.test(line)) {
                nameLine = line;
                break;
            }
        }
        if (!nameLine) {
            var labeled = normalized.match(/(?:^|\n)\s*(?:name|candidate name)\s*[:\-]\s*([A-Za-z][A-Za-z.'\-\s]{2,80})/i);
            if (labeled) nameLine = labeled[1].trim();
        }
        if (nameLine) {
            if (/^dr\.?\s/i.test(nameLine)) data.title = 'Dr.';
            else if (/^mr\.?\s/i.test(nameLine)) data.title = 'Mr.';
            else if (/^mrs\.?\s/i.test(nameLine)) data.title = 'Mrs.';
            else if (/^ms\.?\s/i.test(nameLine)) data.title = 'Ms.';
            var nameParts = parseName(nameLine);
            if (nameParts) {
                data.first_name = nameParts.first;
                data.middle_name = nameParts.middle;
                data.last_name = nameParts.last;
            }
        }

        var desigMatch = normalized.match(/(?:current designation|designation|position|role|job title)\s*[:\-]\s*([^\n|]{2,120})/i);
        if (desigMatch) data.current_designation = desigMatch[1].trim();

        var compMatch = normalized.match(/(?:current company|company|employer|organization|organisation)\s*[:\-]\s*([^\n|]{2,120})/i);
        if (compMatch) data.current_company = compMatch[1].trim();

        var expMatch = flat.match(/(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)(?:\s*(\d{1,2})\s*(?:months?|mos?))?/i);
        if (expMatch) {
            data.experience_years = expMatch[1];
            if (expMatch[2]) data.experience_months = expMatch[2];
        }

        var noticeMatch = flat.match(/(?:notice period)\s*[:\-]?\s*(\d{1,3})\s*(?:days?)?/i);
        if (noticeMatch) data.notice_period = noticeMatch[1];

        var foundQuals = [];
        QUALIFICATION_PATTERNS.forEach(function (q) {
            var re = new RegExp('\\b' + q.replace('.', '\\.') + '\\b', 'i');
            if (re.test(flat) && foundQuals.indexOf(q) === -1) foundQuals.push(q);
        });
        if (foundQuals.length) {
            data.qualification_1 = foundQuals[0];
            if (foundQuals.length > 1) data.qualification_2 = foundQuals[1];
            if (foundQuals.length > 2) data.qualification_3 = foundQuals.slice(2).join(', ');
        }

        if (/indian/i.test(flat) || /\bbengaluru\b|\bbangalore\b|\bkarnataka\b/i.test(flat)) {
            data.nationality = 'Indian';
        }

        if (/\bnurs(e|ing)\b/i.test(flat)) data.post_applied_for = 'Staff Nurse';
        else if (/\bpharmacist\b/i.test(flat)) data.post_applied_for = 'Pharmacist';
        else if (/\b(data analyst|analytics|software|developer|it )\b/i.test(flat)) data.post_applied_for = 'IT Staff';
        else if (/\b(histotechnologist|pathology|lab technician)\b/i.test(flat)) data.post_applied_for = 'Lab Technician';
        else if (/\b(research coordinator|clinical research)\b/i.test(flat)) data.post_applied_for = 'General Application';

        var addressMatch = normalized.match(/(?:address|residence|location)\s*[:\-]\s*([^\n]{10,200})/i);
        if (addressMatch) data.address = addressMatch[1].trim();

        return data;
    }

    function applyParsedData(data, onlyIfEmpty) {
        var filled = [];
        ['first_name', 'middle_name', 'last_name', 'email_id', 'contact_number', 'address',
            'current_designation', 'current_company', 'experience_years', 'experience_months',
            'notice_period', 'qualification_3', 'qualification_4'].forEach(function (id) {
            if (setFieldValue(id, data[id], onlyIfEmpty)) filled.push(id);
        });

        if (data.title && setSelectByMatch('title', data.title, onlyIfEmpty)) filled.push('title');
        if (data.nationality && setSelectByMatch('nationality', data.nationality, onlyIfEmpty)) filled.push('nationality');
        if (data.qualification_1) {
            if (setSelectByMatch('qualification_1', data.qualification_1, onlyIfEmpty)) filled.push('qualification_1');
            else setFieldValue('qualification_3', data.qualification_1, onlyIfEmpty);
        }
        if (data.qualification_2 && setSelectByMatch('qualification_2', data.qualification_2, onlyIfEmpty)) filled.push('qualification_2');
        if (data.post_applied_for && setSelectByMatch('post_applied_for', data.post_applied_for, onlyIfEmpty)) filled.push('post_applied_for');

        return filled;
    }

    function setResumeStatus(message, type) {
        var el = document.getElementById('cv-parse-status');
        if (!el) return;
        el.textContent = message;
        el.className = 'cv-parse-status cv-parse-status--' + (type || 'info');
        el.hidden = !message;
    }

    async function fillFromResume(file, onlyIfEmpty) {
        if (!file) return;
        setResumeStatus('Reading resume and filling form…', 'loading');
        try {
            var text = await extractResumeText(file);
            if (!text || text.trim().length < 20) {
                setResumeStatus('Could not extract enough text from this file. Try a text-based PDF or DOCX.', 'warn');
                return;
            }
            var parsed = extractFieldsFromText(text);
            var filled = applyParsedData(parsed, onlyIfEmpty);
            // Retry after dropdown API data loads
            [1200, 3000].forEach(function (delay) {
                setTimeout(function () {
                    applyParsedData(parsed, onlyIfEmpty);
                }, delay);
            });
            if (filled.length) {
                setResumeStatus('Filled ' + filled.length + ' field(s) from your resume. Please review before submitting.', 'ok');
            } else {
                setResumeStatus('Resume read successfully, but no matching form fields were found to auto-fill.', 'warn');
            }
        } catch (err) {
            setResumeStatus(err.message || 'Could not read resume.', 'err');
        }
    }

    function initJobFilters() {
        var buttons = document.querySelectorAll('.filter-btn[data-filter]');
        var jobs = document.querySelectorAll('#jobs .job');
        var emptyState = document.getElementById('jobs-empty-state');
        if (!buttons.length || !jobs.length) return;

        function applyFilter(category) {
            var visible = 0;
            jobs.forEach(function (job) {
                var jobCategory = (job.getAttribute('data-category') || '').toLowerCase();
                var show = category === 'all' || jobCategory === category;
                job.classList.toggle('is-filtered-out', !show);
                if (show) {
                    job.style.display = '';
                    job.style.opacity = '1';
                    job.style.transform = 'translateY(0)';
                    visible++;
                } else {
                    job.style.display = 'none';
                }
            });
            if (emptyState) {
                emptyState.hidden = visible > 0;
            }
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                buttons.forEach(function (btn) { btn.classList.remove('active'); });
                button.classList.add('active');
                applyFilter((button.getAttribute('data-filter') || 'all').toLowerCase());
            });
        });

        applyFilter('all');
    }

    function initResumeAutofill() {
        var cvInput = document.getElementById('cv_file');
        var fillBtn = document.getElementById('fill-from-resume-btn');
        if (!cvInput) return;

        cvInput.addEventListener('change', function () {
            if (window.showFileName) window.showFileName(cvInput);
            if (cvInput.files && cvInput.files[0]) {
                fillFromResume(cvInput.files[0], true);
            }
        });

        if (fillBtn) {
            fillBtn.addEventListener('click', function () {
                if (!cvInput.files || !cvInput.files[0]) {
                    setResumeStatus('Please upload a CV first (PDF or DOCX).', 'warn');
                    cvInput.click();
                    return;
                }
                fillFromResume(cvInput.files[0], false);
            });
        }
    }

    window.handleDrop = function (e) {
        e.preventDefault();
        var zone = document.getElementById('cv-drop-zone');
        if (zone) {
            zone.style.borderColor = '#cce8d8';
            zone.style.background = '#f9fffc';
        }
        var dt = e.dataTransfer;
        if (!dt || !dt.files.length) return;
        var fi = document.getElementById('cv_file');
        if (!fi) return;
        var dt2 = new DataTransfer();
        dt2.items.add(dt.files[0]);
        fi.files = dt2.files;
        if (window.showFileName) window.showFileName(fi);
        fi.dispatchEvent(new Event('change', { bubbles: true }));
    };

    document.addEventListener('DOMContentLoaded', function () {
        initJobFilters();
        initResumeAutofill();
    });
})();
