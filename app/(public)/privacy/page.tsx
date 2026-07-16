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
        <p className="text-xs text-[#8B5CF6] uppercase tracking-widest font-semibold mb-2">Legal</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-[#475569] text-sm">Effective from January 1, 2025</p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">1. Information we collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Account details such as username, email address, and encrypted password.</li>
            <li>Transaction and order history needed to provide the service.</li>
            <li>Public target links submitted for service fulfillment.</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">2. How we use data</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To operate the platform and complete your orders.</li>
            <li>To send status updates, account notifications, and support messages.</li>
            <li>To protect the system from fraud, abuse, and security incidents.</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">3. Data sharing</h2>
          <p>We do not sell your personal data. We may share limited information only when required to process orders, verify payments, or comply with legal obligations.</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">4. Security</h2>
          <p>We use reasonable technical measures such as encrypted passwords, authenticated sessions, and controlled database access. No system can guarantee absolute security.</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">5. Retention</h2>
          <p>We keep account and transaction data for as long as needed to operate the service, resolve disputes, and meet legal or operational requirements.</p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#334155]">
        <Link href="/terms" className="hover:text-[#8B5CF6] transition-colors">Terms of Service</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#94A3B8] transition-colors">Back to home</Link>
      </div>
    </section>
  );
}
