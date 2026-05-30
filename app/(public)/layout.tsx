import Navbar from '@/components/Navbar';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getBrandName(): Promise<string> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'brand_name'"
    );
    return rows[0]?.setting_value ?? 'AURA SMM';
  } catch {
    return 'AURA SMM';
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const brandName = await getBrandName();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar brandName={brandName} />
      <main className="flex-1 pt-16">{children}</main>
      <footer className="border-t border-[rgba(139,92,246,0.10)] py-8 text-center">
        <p className="text-[#475569] text-sm">
          © {new Date().getFullYear()} <span className="text-[#8B5CF6]">{brandName}</span> · Developed by{' '}
          <span className="text-[#F1F5F9]">Saint</span>
        </p>
      </footer>
    </div>
  );
}
