// Emails the owner about activity from vendors, through Resend's REST API.
// Stays silent until RESEND_API_KEY and NOTIFY_EMAIL are set, and a failed email never fails the
// action that triggered it. Callers await it because serverless functions freeze after responding.

const RESEND_URL = 'https://api.resend.com/emails';
const APP_URL = process.env.APP_URL || 'https://property-material-listing.vercel.app';
// resend.dev can only deliver to the address that owns the Resend account, which is all this needs.
const FROM = process.env.MAIL_FROM || 'MatFlow <onboarding@resend.dev>';

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const render = ({ heading, rows, items = [], page, action }) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f2ed;font-family:Arial,Helvetica,sans-serif;color:#1f1d1a">
<div style="max-width:560px;margin:0 auto;background:#fbfaf7;border:1px solid #e2ddd2;border-radius:10px;padding:24px">
<p style="margin:0 0 4px;font-size:13px;color:#8a8478">MatFlow</p>
<h1 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h1>
<table style="width:100%;border-collapse:collapse;font-size:14px">
${rows.filter(([, value]) => value !== '' && value !== undefined && value !== null).map(([label, value]) => `<tr><td style="padding:5px 12px 5px 0;color:#57524a;vertical-align:top;white-space:nowrap">${escape(label)}</td><td style="padding:5px 0">${escape(value)}</td></tr>`).join('')}
</table>
${items.length ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:14px;border-top:1px solid #e2ddd2">${items.map(([name, amount]) => `<tr><td style="padding:7px 0;border-bottom:1px solid #e2ddd2">${escape(name)}</td><td style="padding:7px 0;border-bottom:1px solid #e2ddd2;text-align:right;white-space:nowrap">${escape(amount)}</td></tr>`).join('')}</table>` : ''}
<p style="margin:20px 0 0"><a href="${escape(`${APP_URL}/#/${page}`)}" style="display:inline-block;background:#b0501d;color:#fffaf5;text-decoration:none;padding:10px 16px;border-radius:7px;font-size:14px">${escape(action)}</a></p>
</div></body></html>`;

const send = async ({ subject, key, ...content }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return false;
  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ from: FROM, to: [to], subject: subject.replace(/\s+/g, ' ').slice(0, 180), html: render(content) }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) console.error('Email failed', response.status, (await response.text()).slice(0, 300));
    return response.ok;
  } catch (error) {
    console.error('Email failed', error.message);
    return false;
  }
};

export const notifyRequest = (r) =>
  send({
    key: `request-${r.requestId}`,
    subject: `New material request: ${r.propertyName} (${usd(r.estimatedTotal)})`,
    heading: 'New material request',
    rows: [['Property', r.propertyName], ['Vendor', r.contractorName], ['Estimate', usd(r.estimatedTotal)], ['Notes', r.notes]],
    items: r.items.map((i) => [`${i.quantity} ${i.unit} × ${i.productName}`, usd(i.estimatedTotal)]),
    page: 'requests',
    action: 'Review the request'
  });

export const notifySuggestion = (s) =>
  send({
    key: `suggestion-${s.suggestionId}`,
    subject: `${s.kind === 'price' ? 'Better price suggested' : 'New material suggested'}: ${s.name}`,
    heading: s.kind === 'price' ? 'A vendor found a better price' : 'A vendor suggested a new material',
    rows: [
      ['Material', s.name],
      ['Vendor', s.submittedBy?.name],
      ['Their price', usd(s.price)],
      ['Catalogue price', s.kind === 'price' ? usd(s.currentPrice) : ''],
      ['Found at', s.store],
      ['Note', s.notes]
    ],
    page: 'suggestions',
    action: 'Review the suggestion'
  });

export const notifySignup = (user) =>
  send({
    key: `signup-${user._id}`,
    subject: `New vendor sign-up: ${user.companyName || user.name}`,
    heading: 'A new vendor signed up',
    rows: [['Name', user.name], ['Company', user.companyName], ['Email', user.email]],
    page: 'vendors',
    action: 'Approve or reject'
  });
