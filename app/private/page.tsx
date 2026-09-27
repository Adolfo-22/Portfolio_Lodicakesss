import type { Metadata } from 'next';
import PrivateGallery from './PrivateGallery';

export const metadata: Metadata = {
  title: 'Just us — Private album',
  robots: { index: false, follow: false },
};
export default function PrivatePage() { return <PrivateGallery />; }
