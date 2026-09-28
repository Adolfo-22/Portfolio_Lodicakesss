'use client';

import { Analytics } from '@vercel/analytics/next';

export default function VisitorAnalytics() {
  return <Analytics beforeSend={event => {
    const url = new URL(event.url);
    if (url.pathname === '/private' || url.pathname.startsWith('/private/')) return null;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  }} />;
}
