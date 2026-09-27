import 'server-only';
import { createHmac, randomBytes, timingSafeEqual, scrypt, createDecipheriv } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';

export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
export const cookieName = 'gallery_session';
export function cookieOptions(request: Request) {
  // Safari does not send Secure cookies over localhost HTTP, even for a local
  // production build. Deployed hosts always require HTTPS.
  const url = new URL(request.url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && request.headers.get('host') === url.host;
  return { httpOnly: true, secure: !local || url.protocol === 'https:', sameSite: 'strict' as const, path: '/private', maxAge: 3600 };
}
export function configured() {
  return /^[a-f0-9]{64}$/.test(process.env.GALLERY_MEDIA_KEY || '') && /^scrypt-v1:[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.GALLERY_PASSWORD_HASH || '');
}
function signature(payload: string) {
  return createHmac('sha256', Buffer.from(process.env.GALLERY_MEDIA_KEY!, 'hex')).update(`gallery-session:${process.env.GALLERY_PASSWORD_HASH}:${payload}`).digest('hex');
}
export function issueSession() {
  const expiresAt = Date.now() + 3600000;
  const payload = `${expiresAt}.${randomBytes(16).toString('hex')}`;
  return { token: `${payload}.${signature(payload)}`, expiresAt };
}
export async function sessionExpiry() {
  if (!configured()) return null;
  const token = (await cookies()).get(cookieName)?.value || '';
  const match = /^(\d{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return null;
  const expiry = Number(match[1]);
  if (expiry <= Date.now() || expiry > Date.now() + 3600000) return null;
  return timingSafeEqual(Buffer.from(match[3], 'hex'), Buffer.from(signature(`${match[1]}.${match[2]}`), 'hex')) ? expiry : null;
}
export async function verifyPassword(password: string) {
  const [, salt, expected] = process.env.GALLERY_PASSWORD_HASH!.split(':');
  const actual = await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export type PrivatePhoto = { id: string; width: number; height: number };
export async function photos(): Promise<PrivatePhoto[]> {
  return JSON.parse(await readFile(path.join(process.cwd(), 'private/gallery/manifest.json'), 'utf8'));
}
export async function photoBytes(id: string, variant: 'thumb' | 'full') {
  const bytes = await readFile(path.join(process.cwd(), 'private/gallery', `${id}.${variant}.enc`));
  if (bytes.subarray(0, 4).toString() !== 'PG01') throw new Error('Invalid gallery asset');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(process.env.GALLERY_MEDIA_KEY!, 'hex'), bytes.subarray(4, 16));
  decipher.setAuthTag(bytes.subarray(16, 32));
  return Buffer.concat([decipher.update(bytes.subarray(32)), decipher.final()]);
}
