# Book Appointment Form – GoDaddy Fix Summary

## What Was Wrong

### 1. Form & action linking
- **Issue:** Form used relative `action="book-appointment.php"` and JS used `fetch('book-appointment.php')`. On some GoDaddy setups (different doc roots, rewrites), relative URLs can resolve incorrectly and cause 404 or wrong script.
- **Fix:** Switched to root-relative URLs: `action="/patient-services/book-appointment.php"` and `fetch('/patient-services/book-appointment.php')`. Same path is used for both so POST and AJAX always hit the same script. If your site lives in a subfolder (e.g. `/SSCHRC/`), change the path to e.g. `/SSCHRC/patient-services/book-appointment.php`.

### 2. PHP hosting compatibility
- **Issue:** No output buffering; any stray output (BOM, newline after `?>`, or from `config.php`) would send output before `header('Content-Type: application/json')`, causing “headers already sent” and broken JSON on GoDaddy.
- **Fix:** `ob_start()` at the top of the PHP script; before sending JSON we call `ob_end_clean()` so no accidental output is sent. `config.php` no longer has a closing `?>` to avoid trailing newlines.

### 3. PHPMailer / SMTP (critical)
- **Issue:** Script used Gmail SMTP (`smtp.gmail.com:587`). On GoDaddy shared hosting, outbound SMTP to Gmail is often blocked or unreliable. Sending from a Gmail address also increases SPF/DKIM issues when the domain is srishankaracancerhospital.org.
- **Fix:** PHPMailer is now configured for **GoDaddy SMTP** when `smtp_provider` is `godaddy` in `config.php`:
  - Host: `smtpout.secureserver.net`
  - Port: 465 (SSL)
  - Encryption: SMTPS (SSL)
  - From address: an email **@srishankaracancerhospital.org** (e.g. `noreply@srishankaracancerhospital.org`), so SPF/DKIM align with the domain.
- Gmail remains available in config for local/XAMPP use; on the server you should use `smtp_provider = 'godaddy'`.

### 4. Error handling & debugging
- **Issue:** Failures could be silent or only in `error_log`; no controlled JSON error response when mail failed.
- **Fix:** All responses are JSON. Mail errors are caught with `MailException`, logged with `error_log()`, and a user-friendly JSON error is returned. Temporary `error_reporting(E_ALL)` and `log_errors = 1` help during debugging; set `display_errors = 0` in production.

### 5. Redirect / success behavior
- **Issue:** No support for redirecting to a thank-you page after success; only in-page success message.
- **Fix:** Optional `success_redirect_url` in `config.php`. If set to a full URL, the PHP success response includes `redirect_url` and the JS performs `window.location.href = data.redirect_url`. If not set, behavior is unchanged (alert + form clear).

### 6. Security & production
- **Issue:** Risk of output from config, and catch block used generic `Exception` (could catch non-mail exceptions).
- **Fix:** Config is included with `@include` and validated; no closing `?>`. PHPMailer’s `Exception` is aliased as `MailException` and only that is caught so other exceptions are not swallowed. Inputs are sanitized with `clean_input()` / `safe_string()`; honeypot and validation are unchanged.

---

## Why It Worked on XAMPP But Failed on GoDaddy

| Area | XAMPP (localhost) | GoDaddy (live) |
|------|-------------------|----------------|
| **SMTP** | Gmail SMTP works; outbound 587 is open. | Outbound SMTP to Gmail often blocked or restricted; must use GoDaddy relay. |
| **mail()** | Often works with local MTA or fake mail. | Unreliable or disabled on shared hosting; we use SMTP only. |
| **Output / headers** | Loose; extra newlines may not break. | Stricter; any output before `header()` can cause “headers already sent” and break JSON. |
| **Paths** | Relative paths from one folder usually work. | Doc root and rewrites can make relative form/fetch URLs point to wrong place; root-relative is safer. |
| **From address** | Gmail From is acceptable for testing. | Sender should be @srishankaracancerhospital.org to avoid SPF/DKIM rejection. |

---

## SMTP / Hosting Constraints (GoDaddy)

- Use **GoDaddy’s SMTP relay**: `smtpout.secureserver.net`, port **465**, SSL. Do not rely on Gmail or other external SMTP on the server.
- **From address** must be an email on your domain (e.g. `noreply@srishankaracancerhospital.org`). Create this mailbox in GoDaddy (Workspace Email or cPanel) and use its password in `config.php` as `godaddy_password`.
- Recipient can remain `appointments@sschrc.org` (or any address); only the **sender** must be from the domain for deliverability.

---

## Reusing This for Other Forms

- **Same config:** Use the same `config.php`; it already supports `recipient_email`, `smtp_provider`, GoDaddy and Gmail keys.
- **Same PHP pattern:** Start with `ob_start()`, load PHPMailer, read config, validate and sanitize POST, send via SMTP with a domain From, return JSON and call `ob_end_clean()` before `echo json_encode(...)`.
- **Same HTML pattern:** Form `action` and `fetch()` URL should be the same root-relative path to the form’s PHP handler; keep field `name` attributes in sync with `$_POST` keys.

---

## Files Changed

- **patient-services/book-appointment.html** – Form `action` and `fetch()` URL set to `/patient-services/book-appointment.php`; optional success redirect handling.
- **patient-services/book-appointment.php** – Output buffering, GoDaddy SMTP support, MailException, JSON-only responses, optional `redirect_url` in success.
- **patient-services/config.php** – GoDaddy SMTP options, `smtp_provider`, no closing `?>`, placeholder passwords for you to replace.

Replace `YOUR_GODADDY_EMAIL_PASSWORD` and `YOUR_GMAIL_APP_PASSWORD` in `config.php` with the real values for the domain mailbox and (if used) Gmail App Password.

**If you see "Server configuration error" on the live site:**  
Upload `config.php` to the **patient-services** folder on GoDaddy (same folder as `book-appointment.php`). The script will also try the parent folder and `Config.php` (capital C). If no config file is found, it uses built-in defaults and will then fail at sending email with "Could not send email" until you add `config.php` with the correct `godaddy_password`.

