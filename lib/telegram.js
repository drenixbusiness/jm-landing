// Posts form submissions to a Telegram group via the Bot API (server-side only).
const API = 'https://api.telegram.org';

const FORMS = {
  'home-join': '🚛 Home · Join today – apply',
  'home-callback': '📞 Home · Call back request',
  'driver-application': '📝 Driver Application',
  'jobs-application': '💼 Employee Application (Jobs)',
  'about-question': '❓ About · Question',
  'contact-question': '❓ Contact · Question',
};

const LABELS = {
  fullName: 'Full name',
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  age: 'Age',
  position: 'Position',
  experienceAreas: 'Experience areas',
  experienceLength: 'Experience',
  languages: 'Languages',
  shiftAgreement: '17:00–03:00 Tashkent shift',
  state: 'State',
  source: 'Heard about us',
  hasTruck: 'Has a semi-truck',
  truckModelYear: 'Truck model & year',
  question: 'Question',
  smsConsent: 'SMS consent',
};

const FILE_LABELS = { cv: 'CV', cdl: 'CDL pictures' };

// Fields that are folded into another line or are internal.
const SKIP = new Set(['form', 'page', 'experienceUnit']);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export function formatLead(data, receivedAt) {
  const get = (k) => data.get(k);
  const formId = String(get('form') || 'unknown');
  const lines = [`<b>${esc(FORMS[formId] || `Form: ${formId}`)}</b>`, ''];
  for (const [key, value] of data.entries()) {
    if (SKIP.has(key) || typeof value !== 'string') continue;
    let v = value.trim();
    if (!v) continue;
    if (key === 'smsConsent') v = v === 'true' ? '✅ Agreed' : '❌ Not agreed';
    if (key === 'experienceLength' && get('experienceUnit')) v = `${v} ${get('experienceUnit')}`;
    lines.push(`<b>${esc(LABELS[key] || key)}:</b> ${esc(v).slice(0, 1500)}`);
  }
  const files = [...data.entries()].filter(([, v]) => typeof v !== 'string' && v.size > 0);
  if (files.length) lines.push(`<b>Files:</b> ${files.map(([, f]) => esc(f.name)).join(', ')} (attached below)`);
  const page = get('page');
  const when = new Date(receivedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
  lines.push('', `<i>${esc(when)} CT${page ? ` · ${esc(page)}` : ''}</i>`);
  return lines.join('\n');
}

async function call(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`${API}/bot${token}/${method}`, { method: 'POST', body, signal: AbortSignal.timeout(20000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    const err = new Error(`Telegram ${method} failed: ${json.description || res.status}`);
    err.migrateTo = json.parameters?.migrate_to_chat_id;
    throw err;
  }
  return json.result;
}

// A group upgraded to a supergroup gets a new id; follow it so leads keep arriving.
let migratedChatId = null;

export async function sendLeadToTelegram(data, receivedAt) {
  let chatId = migratedChatId || process.env.TELEGRAM_CHAT_ID;
  const text = formatLead(data, receivedAt);
  const message = (id) => new URLSearchParams({ chat_id: id, text, parse_mode: 'HTML', disable_web_page_preview: 'true' });
  let sent;
  try {
    sent = await call('sendMessage', message(chatId));
  } catch (err) {
    if (!err.migrateTo) throw err;
    migratedChatId = chatId = String(err.migrateTo);
    console.warn(`[telegram] group was upgraded to a supergroup — set TELEGRAM_CHAT_ID=${chatId} in your env`);
    sent = await call('sendMessage', message(chatId));
  }

  // Uploaded files (CV, CDL photos) go as documents, replying to the lead message.
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string' || !value.size) continue;
    const fd = new FormData();
    fd.append('chat_id', chatId);
    fd.append('reply_to_message_id', String(sent.message_id));
    fd.append('caption', `${FILE_LABELS[key] || key}: ${value.name}`.slice(0, 1000));
    fd.append('document', value, value.name || 'file');
    await call('sendDocument', fd);
  }
}
