import { randomBytes, scryptSync, createCipheriv } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
let env = await readFile(envPath, 'utf8').catch(() => '');
const existing = (name) => env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
const keyHex = existing('GALLERY_MEDIA_KEY') || randomBytes(32).toString('hex');
if (!/^[a-f0-9]{64}$/.test(keyHex)) throw new Error('Invalid gallery media key');
let hash = existing('GALLERY_PASSWORD_HASH');
if (!hash || process.env.GALLERY_NEW_PASSWORD) {
  const password = process.env.GALLERY_NEW_PASSWORD || randomBytes(18).toString('base64url');
  if (password.length < 6) throw new Error('Use a password of at least 6 characters');
  const salt = randomBytes(16).toString('hex');
  hash = `scrypt-v1:${salt}:${scryptSync(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
  await mkdir(path.join(root, 'private'), { recursive: true });
  await writeFile(path.join(root, 'private/gallery-access.txt'), `Private gallery: /private\nPassword: ${password}\n\nKeep this file private. Hosting needs GALLERY_MEDIA_KEY and GALLERY_PASSWORD_HASH from .env.local.\n`);
}
for (const [name, value] of Object.entries({ GALLERY_MEDIA_KEY: keyHex, GALLERY_PASSWORD_HASH: hash })) {
  const line = `${name}=${value}`;
  env = existing(name) ? env.replace(new RegExp(`^${name}=.*$`, 'm'), line) : `${env.trimEnd()}\n${line}\n`;
}
await writeFile(envPath, env.trimStart());
const source = path.join(root, 'private/gallery-originals');
const target = path.join(root, 'private/gallery');
await mkdir(target, { recursive: true });
const names = (await readdir(source)).filter(n => /\.(jpe?g|png|webp)$/i.test(n)).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
const manifest = [];
for (const [index, name] of names.entries()) {
  const id = `photo-${String(index + 1).padStart(2, '0')}`;
  for (const [variant, width] of [['thumb', 600], ['full', 1800]]) {
    const { data, info } = await sharp(path.join(source, name)).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    await writeFile(path.join(target, `${id}.${variant}.enc`), Buffer.concat([Buffer.from('PG01'), iv, cipher.getAuthTag(), encrypted]));
    if (variant === 'full') manifest.push({ id, width: info.width, height: info.height });
  }
}
await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${manifest.length} encrypted photos. Local password: private/gallery-access.txt. Hosting settings: .env.local (never commit these files).`);
