import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy | AURA SMM',
  description: 'Privacy policy and personal data handling practices for AURA SMM.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: 'Privacy Policy | AURA SMM',
    description: 'Privacy policy and personal data handling practices for AURA SMM.',
    url: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-10">
        <p className="text-xs text-[#7C3AED] uppercase tracking-widest font-bold mb-2">Legal</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold text-[#2D1B4E] mb-2">
          Privacy Policy
        </h1>
        <p className="text-[#6B5B82] text-sm">Effective from January 1, 2025</p>
      </div>

      <div className="space-y-6 text-[#4A3B63] leading-relaxed text-sm sm:text-base">
        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg">1. Information we collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Account details such as username, email address, and encrypted password.</li>
            <li>Transaction and order history needed to provide the service.</li>
            <li>Public target links submitted for service fulfillment.</li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg">2. How we use data</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To operate the platform and complete your orders.</li>
            <li>To send status updates, account notifications, and support messages.</li>
            <li>To protect the system from fraud, abuse, and security incidents.</li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg">3. Data sharing</h2>
          <p>We do not sell your personal data. We may share limited information only when required to process orders, verify payments, or comply with legal obligations.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg">4. Security</h2>
          <p>We use reasonable technical measures such as encrypted passwords, authenticated sessions, and controlled database access. No system can guarantee absolute security.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg">5. Retention</h2>
          <p>We keep account and transaction data for as long as needed to operate the service, resolve disputes, and meet legal or operational requirements.</p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#6B5B82] font-medium">
        <Link href="/terms" className="hover:text-[#2D1B4E] transition-colors">Terms of Service</Link>
        <span>·</span>
        <Link href="/refund" className="hover:text-[#2D1B4E] transition-colors">Refund Policy</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#2D1B4E] transition-colors">Back to home</Link>
      </div>
    </section>
  );
}
