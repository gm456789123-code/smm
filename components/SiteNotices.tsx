'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import PdpaConsent from '@/components/PdpaConsent';

export default function SiteNotices() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState({ pathname: '', visible: true });
  const onVisibilityChange = useCallback((visible: boolean) => {
    setAnnouncement({ pathname, visible });
  }, [pathname]);
  const announcementPending = announcement.pathname !== pathname || announcement.visible;

  return (
    <>
      <AnnouncementPopup onVisibilityChange={onVisibilityChange} />
      <PdpaConsent paused={announcementPending} />
    </>
  );
}
