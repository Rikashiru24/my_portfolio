/**
 * Portfolio contact backend
 *
 * Setup:
 * 1. Open https://script.google.com and create a new project
 * 2. Paste this file into Code.gs
 * 3. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL into CONTACT_CONFIG.appsScriptUrl in script.js
 * 5. Submit the form once, approve Gmail permissions when Google asks
 */

const RECIPIENT_EMAIL = '2017harvinarisga@gmail.com';
const CACHE_PREFIX = 'portfolio_verify_';
const CODE_TTL_SECONDS = 600;
const BLOCKED_GMAILS = ['test@gmail.com', 'fake@gmail.com', 'example@gmail.com', 'user@gmail.com'];

function doGet() {
  return jsonResponse({
    success: true,
    message: 'Portfolio contact backend is online.',
    recipient: RECIPIENT_EMAIL
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'sendCode') {
      return jsonResponse(handleSendCode(data.email));
    }

    if (data.action === 'submit') {
      return jsonResponse(handleSubmit(data));
    }

    return jsonResponse({ success: false, error: 'Invalid request.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Server error.' });
  }
}

function handleSendCode(email) {
  const normalizedEmail = normalizeGmail(email);
  if (!normalizedEmail) {
    return { success: false, error: 'Enter a valid Gmail address (@gmail.com).' };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put(CACHE_PREFIX + normalizedEmail, code, CODE_TTL_SECONDS);

  try {
    GmailApp.sendEmail(
      normalizedEmail,
      'Portfolio verification code',
      'Your verification code is: ' + code + '\n\nIt expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.'
    );
  } catch (err) {
    return { success: false, error: 'Could not send code to that Gmail. Use your real Gmail address.' };
  }

  return { success: true, message: 'Verification code sent to your Gmail.' };
}

function handleSubmit(data) {
  const normalizedEmail = normalizeGmail(data.email);
  const code = String(data.code || '').trim();
  const name = String(data.name || '').trim();
  const message = String(data.message || '').trim();

  if (!normalizedEmail) {
    return { success: false, error: 'Enter a valid Gmail address (@gmail.com).' };
  }

  const cachedCode = CacheService.getScriptCache().get(CACHE_PREFIX + normalizedEmail);
  if (!cachedCode || cachedCode !== code) {
    return { success: false, error: 'Invalid or expired verification code.' };
  }

  if (name.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters.' };
  }

  if (message.length < 10) {
    return { success: false, error: 'Message must be at least 10 characters.' };
  }

  const body =
    'From: ' + name + '\n' +
    'Verified Gmail: ' + normalizedEmail + '\n\n' +
    message;

  try {
    GmailApp.sendEmail(
      RECIPIENT_EMAIL,
      '[Portfolio] New message from ' + name,
      body,
      { replyTo: normalizedEmail, name: name }
    );
  } catch (err) {
    return { success: false, error: 'Could not deliver your message: ' + (err.message || 'Gmail error.') };
  }

  try {
    if (normalizedEmail !== RECIPIENT_EMAIL) {
      GmailApp.sendEmail(
        normalizedEmail,
        'Portfolio message received',
        'Hi ' + name + ',\n\nYour message was sent to Harvin successfully.\n\n--- Your message ---\n' + message
      );
    }
  } catch (err) {
    /* Optional receipt — do not fail the main delivery if this bounces later. */
  }

  CacheService.getScriptCache().remove(CACHE_PREFIX + normalizedEmail);
  return { success: true, message: 'Message delivered to ' + RECIPIENT_EMAIL + '.' };
}

function normalizeGmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@(gmail|googlemail)\.com$/.test(value)) {
    return '';
  }
  const normalized = value.replace(/@googlemail\.com$/, '@gmail.com');
  if (BLOCKED_GMAILS.indexOf(normalized) !== -1) {
    return '';
  }
  return normalized;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
