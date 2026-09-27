import { photos, photoBytes, privateHeaders, sessionExpiry } from '@/lib/private-gallery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await sessionExpiry()) return new Response(null, { status: 401, headers: privateHeaders });
  const { id } = await context.params;
  if (!/^photo-\d{2,4}$/.test(id) || !(await photos()).some(photo => photo.id === id)) return new Response(null, { status: 404, headers: privateHeaders });
  try {
    const variant = new URL(request.url).searchParams.get('variant') === 'thumb' ? 'thumb' : 'full';
    return new Response(new Uint8Array(await photoBytes(id, variant)), { headers: { ...privateHeaders, 'Content-Type': 'image/webp', 'Cross-Origin-Resource-Policy': 'same-origin' } });
  } catch {
    return new Response(null, { status: 503, headers: privateHeaders });
  }
}
