/**
 * Portfolio contact backend
 *
 * Setup:
 * 1. Open https://script.google.com and create a new project
 * 2. Paste this file into Code.gs
 * 3. Services (+) → add "Gmail API" (helps move messages to Primary tab)
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL into CONTACT_CONFIG.appsScriptUrl in script.js
 * 6. Submit the form once, approve Gmail + Drive permissions when Google asks
 * 7. A Google Sheet log is created automatically on the first submission
 */

const RECIPIENT_EMAIL = '2017harvinarisga@gmail.com';
const CACHE_PREFIX = 'portfolio_verify_';
const CODE_TTL_SECONDS = 600;
const BLOCKED_GMAILS = ['test@gmail.com', 'fake@gmail.com', 'example@gmail.com', 'user@gmail.com'];

function doGet() {
  const sheetUrl = PropertiesService.getScriptProperties().getProperty('SUBMISSIONS_SHEET_URL');
  return jsonResponse({
    success: true,
    message: 'Portfolio contact backend is online.',
    recipient: RECIPIENT_EMAIL,
    submissionsSheet: sheetUrl || null
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

  const subject = name + ' sent a message through your portfolio';
  const body =
    name + ' wrote:\n\n' +
    message + '\n\n' +
    '---\n' +
    'Reply to: ' + normalizedEmail + '\n' +
    'Verified Gmail: ' + normalizedEmail;
  const htmlBody =
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;">' +
    '<p style="margin:0 0 12px;"><strong>' + escapeHtml(name) + '</strong> sent you a message from your portfolio site.</p>' +
    '<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid #00f0ff;background:#f4f8fb;">' +
    escapeHtml(message).replace(/\n/g, '<br>') +
    '</blockquote>' +
    '<p style="margin:0;font-size:13px;color:#555;">Reply to: <a href="mailto:' + escapeHtml(normalizedEmail) + '">' +
    escapeHtml(normalizedEmail) + '</a></p>' +
    '</div>';

  try {
    GmailApp.sendEmail(
      RECIPIENT_EMAIL,
      subject,
      body,
      {
        replyTo: normalizedEmail,
        name: name,
        htmlBody: htmlBody
      }
    );
    markPortfolioInboxMessage(subject);
    logSubmission(name, normalizedEmail, message);
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

function markPortfolioInboxMessage(subject) {
  try {
    Utilities.sleep(1000);
    const safeSubject = subject.replace(/"/g, '\\"');
    const threads = GmailApp.search('subject:"' + safeSubject + '" newer_than:1d', 0, 1);
    if (!threads.length) return;

    const thread = threads[0];
    let label = GmailApp.getUserLabelByName('Portfolio Inquiries');
    if (!label) label = GmailApp.createLabel('Portfolio Inquiries');

    thread.addLabel(label);
    thread.markImportant();
    thread.moveToInbox();

    const messages = thread.getMessages();
    promoteMessageToPrimary(messages[messages.length - 1].getId());
  } catch (err) {
    /* Labeling is optional — delivery already succeeded. */
  }
}

function promoteMessageToPrimary(messageId) {
  try {
    Gmail.Users.Messages.modify('me', messageId, {
      addLabelIds: ['CATEGORY_PERSONAL', 'IMPORTANT', 'INBOX'],
      removeLabelIds: ['CATEGORY_UPDATES', 'CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL']
    });
  } catch (err) {
    /* Enable Gmail API under Services if Primary promotion is needed. */
  }
}

function logSubmission(name, email, message) {
  try {
    const sheet = getSubmissionSheet();
    sheet.appendRow([new Date(), name, email, message]);
  } catch (err) {
    /* Sheet logging is optional — email delivery already succeeded. */
  }
}

function getSubmissionSheet() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty('SUBMISSIONS_SHEET_ID');
  if (existingId) {
    return SpreadsheetApp.openById(existingId).getSheetByName('Submissions')
      || SpreadsheetApp.openById(existingId).getActiveSheet();
  }

  const ss = SpreadsheetApp.create('Portfolio Contact Submissions');
  const sheet = ss.getActiveSheet();
  sheet.setName('Submissions');
  sheet.appendRow(['Timestamp', 'Name', 'Email', 'Message']);
  sheet.setFrozenRows(1);

  props.setProperty('SUBMISSIONS_SHEET_ID', ss.getId());
  props.setProperty('SUBMISSIONS_SHEET_URL', ss.getUrl());
  return sheet;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
