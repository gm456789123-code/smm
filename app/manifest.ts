import { MetadataRoute } from 'next';
import { SITE_DESCRIPTION } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AURA SMM Panel',
    short_name: 'AURA SMM',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#07090F',
    theme_color: '#8B5CF6',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

