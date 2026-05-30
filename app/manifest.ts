import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AURA SMM Panel',
    short_name: 'AURA SMM',
    description: 'บริการ SMM Panel คุณภาพสูง เร็ว เสถียร ราคาถูก เพิ่ม Followers, Likes, Views ทุกแพลตฟอร์ม',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090F',
    theme_color: '#8B5CF6',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
