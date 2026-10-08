// Receives every form on the site (multipart/form-data).
// - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID: posts the lead (and any uploaded files) to the Telegram group.
// - LEAD_WEBHOOK_URL (optional): also forwards the raw submission to a CRM / Make / Zapier hook.
import { sendLeadToTelegram, telegramConfigured } from '@/lib/telegram';

export const runtime = 'nodejs';

const MAX_FILE = 10 * 1024 * 1024;

export async function POST(request) {
  let data;
  try {
    data = await request.formData();
  } catch {
    return Response.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const summary = {};
  for (const [k, v] of data.entries()) {
    if (typeof v === 'string') summary[k] = v.slice(0, 2000);
    else {
      if (v.size > MAX_FILE) return Response.json({ ok: false, error: 'File too large' }, { status: 413 });
      summary[k] = `[file ${v.name}, ${v.size} bytes]`;
    }
  }
  if (!summary.form) return Response.json({ ok: false, error: 'Missing form id' }, { status: 400 });
  // Every form requires the SMS consent checkbox; enforce it here too so it can't be bypassed.
  if (summary.smsConsent !== 'true') return Response.json({ ok: false, error: 'Consent required' }, { status: 400 });
  const receivedAt = new Date().toISOString();

  const tasks = [];
  if (telegramConfigured()) tasks.push(sendLeadToTelegram(data, receivedAt));

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    const fwd = new FormData();
    for (const [k, v] of data.entries()) fwd.append(k, v);
    fwd.append('receivedAt', receivedAt);
    tasks.push(
      fetch(hook, { method: 'POST', body: fwd }).then((res) => {
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      }),
    );
  }

  if (!tasks.length) {
    console.info('[lead]', JSON.stringify({ ...summary, receivedAt }));
    return Response.json({ ok: true });
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error('[lead] delivery failed:', r.reason?.message || r.reason));
  // Succeed if at least one destination received the lead; otherwise let the form show its retry message.
  if (failed.length === results.length) return Response.json({ ok: false }, { status: 502 });
  return Response.json({ ok: true });
}
