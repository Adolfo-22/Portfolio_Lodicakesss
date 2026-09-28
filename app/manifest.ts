import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Proilan Adolfo — Portfolio',
    short_name: 'Proilan',
    description: 'Proilan Adolfo’s portfolio, projects, and personal updates.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/Theme/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/Theme/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
