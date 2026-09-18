'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import PdpaConsent from '@/components/PdpaConsent';

export default function SiteNotices() {
  return (
    <>
      <AnnouncementPopup onVisibilityChange={() => {}} />
      <PdpaConsent />
    </>
  );
}
