// Emails the owner about activity from vendors, through Resend's REST API.
// Stays silent until RESEND_API_KEY is set, and a failed email never fails the action that
// triggered it. Callers await it because serverless functions freeze after responding.
import { User } from '../models/User.js';

const RESEND_URL = 'https://api.resend.com/emails';
const APP_URL = process.env.APP_URL || 'https://property-material-listing.vercel.app';
// resend.dev can only deliver to the address that owns the Resend account, which is all this needs.
const FROM = process.env.MAIL_FROM || 'MatFlow <onboarding@resend.dev>';

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const filled = (rows) => rows.filter(([, value]) => value !== '' && value !== undefined && value !== null);

const detailRow = ([label, value, href]) => `<tr>
<td style="padding:6px 16px 6px 0;color:#57524a;vertical-align:top;white-space:nowrap">${escape(label)}</td>
<td style="padding:6px 0;color:#1f1d1a">${href ? `<a href="${escape(href)}" style="color:#b0501d">${escape(value)}</a>` : escape(value)}</td>
</tr>`;

const itemRow = ([name, amount]) => `<tr>
<td style="padding:8px 12px 8px 0;border-top:1px solid #e2ddd2;color:#1f1d1a">${escape(name)}</td>
<td style="padding:8px 0;border-top:1px solid #e2ddd2;text-align:right;white-space:nowrap;color:#1f1d1a">${escape(amount)}</td>
</tr>`;

// Every alert has the same shape, so the owner can tell at a glance what it is and what to do:
// a coloured label, one sentence on what happened, the details, then the next step and a button.
export const renderHtml = ({ label, tone, title, summary, rows, items = [], total, next, page, action }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ed">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ed"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2ddd2;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f1d1a">
<tr><td style="padding:20px 24px 0;font-size:13px;font-weight:bold;color:#57524a">MatFlow</td></tr>
<tr><td style="padding:12px 24px 0"><span style="display:inline-block;padding:4px 10px;border-radius:4px;background:${tone};color:#ffffff;font-size:12px;font-weight:bold">${escape(label)}</span></td></tr>
<tr><td style="padding:12px 24px 0"><h1 style="margin:0;font-size:21px;line-height:1.3;color:#1f1d1a">${escape(title)}</h1></td></tr>
<tr><td style="padding:8px 24px 0;color:#57524a">${escape(summary)}</td></tr>
<tr><td style="padding:16px 24px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${filled(rows).map(detailRow).join('')}</table></td></tr>
${items.length ? `<tr><td style="padding:16px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${items.map(itemRow).join('')}${total ? `<tr><td style="padding:10px 12px 0 0;border-top:1px solid #cfc8ba;font-weight:bold">Estimated total</td><td style="padding:10px 0 0;border-top:1px solid #cfc8ba;text-align:right;font-weight:bold">${escape(total)}</td></tr>` : ''}</table></td></tr>` : ''}
<tr><td style="padding:20px 24px 0"><div style="padding:12px 14px;background:#f4f2ed;border-radius:7px;font-size:14px"><strong>What to do next:</strong> ${escape(next)}</div></td></tr>
<tr><td style="padding:18px 24px 24px"><a href="${escape(`${APP_URL}/#/${page}`)}" style="display:inline-block;padding:12px 20px;background:#b0501d;color:#ffffff;text-decoration:none;border-radius:7px;font-size:15px;font-weight:bold">${escape(action)}</a></td></tr>
</table>
<p style="max-width:560px;margin:14px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a8478">MatFlow sends this automatically when a vendor does something in the portal.</p>
</td></tr></table></body></html>`;

export const renderText = ({ label, title, summary, rows, items = [], total, next, page, action }) =>
  [
    `${label.toUpperCase()}: ${title}`,
    '',
    summary,
    '',
    ...filled(rows).map(([name, value, href]) => `${name}: ${href || value}`),
    ...(items.length ? ['', ...items.map(([name, amount]) => `- ${name}: ${amount}`)] : []),
    ...(total ? [`Estimated total: ${total}`] : []),
    '',
    `What to do next: ${next}`,
    '',
    `${action}: ${APP_URL}/#/${page}`
  ].join('\n');

// NOTIFY_EMAIL overrides the recipient; otherwise alerts go to the admin account's own email.
const recipient = async () => {
  if (process.env.NOTIFY_EMAIL) return process.env.NOTIFY_EMAIL;
  const admin = await User.findOne({ role: 'admin', active: true }).sort({ createdAt: 1 }).select('email').lean();
  return admin?.email || '';
};

const send = async ({ subject, key, replyTo, ...content }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const to = await recipient();
    if (!to) return false;
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: subject.replace(/\s+/g, ' ').slice(0, 180),
        html: renderHtml(content),
        text: renderText(content),
        ...(replyTo ? { reply_to: replyTo } : {})
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) console.error('Email failed', response.status, (await response.text()).slice(0, 300));
    return response.ok;
  } catch (error) {
    console.error('Email failed', error.message);
    return false;
  }
};

const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const requestEmail = (r) => ({
  key: `request-${r.requestId}`,
  replyTo: r.contractorEmail,
  subject: `Action needed: material request for ${r.propertyName} (${usd(r.estimatedTotal)})`,
  label: 'Material request',
  tone: '#b0501d',
  title: `${r.contractorName} needs materials for ${r.propertyName}`,
  summary: `${count(r.items.length, 'item')}, estimated at ${usd(r.estimatedTotal)}. Waiting for your approval.`,
  rows: [['Property', r.propertyName], ['Vendor', r.contractorName], ['Vendor notes', r.notes], ['Request number', r.requestId]],
  items: r.items.map((i) => [`${i.quantity}${i.unit && i.unit !== 'each' ? ` ${i.unit}` : ''} × ${i.productName}`, usd(i.estimatedTotal)]),
  total: usd(r.estimatedTotal),
  next: 'Open the request and approve or reject it. Once it is approved you can send it to the Amazon cart.',
  page: 'requests',
  action: 'Review this request'
});

export const suggestionEmail = (s) => {
  const better = s.kind === 'price';
  const saving = better && s.currentPrice > 0 ? s.currentPrice - s.price : 0;
  const vendor = s.submittedBy?.name || 'A vendor';
  return {
    key: `suggestion-${s.suggestionId}`,
    replyTo: s.submittedBy?.email,
    subject: better ? `Review: cheaper price for ${s.name} from ${vendor}` : `Review: new material suggested by ${vendor}: ${s.name}`,
    label: better ? 'Better price' : 'New material',
    tone: '#2c6440',
    title: better ? `${vendor} found a cheaper ${s.name}` : `${vendor} suggested adding ${s.name}`,
    summary: better
      ? `${usd(s.price)} at ${s.store || 'another store'}${saving > 0 ? `, which saves ${usd(saving)} on your catalogue price` : ''}.`
      : `${usd(s.price)} at ${s.store || 'another store'}. It is not in your catalogue yet.`,
    rows: [
      ['Material', s.name],
      ['Vendor', vendor],
      ['Their price', usd(s.price)],
      ['Your catalogue price', better ? usd(s.currentPrice) : ''],
      ['Details', s.details],
      ['Why this one', s.notes],
      ['Where they found it', s.store || 'Open the link', s.supplierLink]
    ],
    next: 'Check the link, then approve or reject it. Nothing changes in your catalogue until you approve.',
    page: 'suggestions',
    action: 'Review this suggestion'
  };
};

export const signupEmail = (user) => ({
  key: `signup-${user._id}`,
  replyTo: user.email,
  subject: `Action needed: new vendor sign-up from ${user.companyName || user.name}`,
  label: 'New vendor sign-up',
  tone: '#2f4f73',
  title: `${user.companyName || user.name} wants to join MatFlow`,
  summary: `${user.name} created a vendor account and is waiting for your approval.`,
  rows: [['Name', user.name], ['Company', user.companyName], ['Email', user.email]],
  next: 'Approve or reject the sign-up on the Vendors page, then assign their properties. They cannot see or order anything until you do.',
  page: 'vendors',
  action: 'Review this sign-up'
});

export const notifyRequest = (request) => send(requestEmail(request));
export const notifySuggestion = (suggestion) => send(suggestionEmail(suggestion));
export const notifySignup = (user) => send(signupEmail(user));
