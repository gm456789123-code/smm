const FALLBACK_SITE_URL = 'https://aura-smm.com';

function normalizeSiteUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return FALLBACK_SITE_URL;

  try {
    const url = new URL(raw);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
export const SITE_NAME = 'AURA SMM';
export const SITE_TITLE = 'AURA SMM - ปั๊มฟอล ปั๊มไลก์ เพิ่มยอดวิว โซเชียลมีเดียอันดับ 1';
export const SITE_DESCRIPTION =
  'AURA SMM ผู้ให้บริการปั๊มฟอล ปั๊มไลก์ เพิ่มยอดวิว ครบทุกแพลตฟอร์ม ราคาถูกที่สุด เริ่มต้น 10 บาท ระบบออโต้ 24 ชม. ปลอดภัย รวดเร็ว สมัครใช้งานฟรี!';
export const SITE_OG_IMAGE = `${SITE_URL}/icon.png`;
export const SITE_ICON = `${SITE_URL}/icon.png`;
