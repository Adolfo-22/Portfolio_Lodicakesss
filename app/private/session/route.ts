import { cookies } from 'next/headers';
import { configured, cookieName, cookieOptions, issueSession, photos, privateHeaders, sessionExpiry, verifyPassword } from '@/lib/private-gallery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; until: number }>();
let active = 0;
const json = (body: object, status = 200) => Response.json(body, { status, headers: privateHeaders });
function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export async function GET() {
  if (!configured()) return json({ error: 'The private album is not available yet.' }, 503);
  const expiresAt = await sessionExpiry();
  return expiresAt ? json({ photos: await photos(), expiresAt }) : json({ locked: true }, 401);
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Please open the gallery on this website.' }, 403);
  if (!configured()) return json({ error: 'The private album is not available yet.' }, 503);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid request.' }, 400);
  // This bounded, per-instance limiter supplements a strong password. Use hosting
  // rate limiting for a shared limit across multiple server instances.
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim().slice(0, 100);
  const entry = attempts.get(ip) || { count: 0, until: now + 900000 };
  if (entry.count >= 5 || active >= 4 || attempts.size >= 10000) return json({ error: 'Too many attempts. Please try again in 15 minutes.' }, 429);
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Enter a password.' }, 400);
    let text = '';
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.length > 2048) { await reader.cancel(); return json({ error: 'Invalid request.' }, 413); }
    }
    body = JSON.parse(text);
  } catch { return json({ error: 'Invalid request.' }, 400); }
  if (typeof body?.password !== 'string' || body.password.length > 256) return json({ error: 'Enter a valid password.' }, 400);
  entry.count++;
  attempts.set(ip, entry);
  active++;
  try {
    if (!await verifyPassword(body.password)) return json({ error: 'That password is not correct. Try again.' }, 401);
    attempts.delete(ip);
    const session = issueSession();
    (await cookies()).set(cookieName, session.token, cookieOptions(request));
    return json({ photos: await photos(), expiresAt: session.expiresAt });
  } finally { active--; }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request.' }, 403);
  (await cookies()).set(cookieName, '', { ...cookieOptions(request), maxAge: 0 });
  return json({ locked: true });
}
