import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service | AURA SMM',
  description: 'Terms and conditions for using AURA SMM services.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: 'Terms of Service | AURA SMM',
    description: 'Terms and conditions for using AURA SMM services.',
    url: `${SITE_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-10">
        <p className="text-xs text-[#8B5CF6] uppercase tracking-widest font-semibold mb-2">Legal</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-[#475569] text-sm">Effective from January 1, 2025</p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">1. Acceptance</h2>
          <p>By using AURA SMM or creating an account, you agree to these terms. If you do not agree, please stop using the service.</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">2. Services</h2>
          <p>AURA SMM provides social media marketing related services such as followers, likes, views, and other engagement tools. We may update, change, or discontinue any service at any time.</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">3. Credits and refunds</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Account credits are generally non-refundable once added to your balance.</li>
            <li>Prices may change without prior notice.</li>
            <li>Orders that are already in progress may not be cancellable unless the service explicitly supports cancellation.</li>
            <li>If an order fails due to a system issue, we may return credit back to your account.</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">4. User responsibilities</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>You are responsible for securing your account credentials.</li>
            <li>You must not use the service for illegal, deceptive, or harmful activity.</li>
            <li>You must not attempt to attack, abuse, or interfere with the website or its infrastructure.</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">5. Disclaimer</h2>
          <p>Services are provided as available. We do not guarantee specific business outcomes, growth results, or uninterrupted availability.</p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#334155]">
        <Link href="/privacy" className="hover:text-[#8B5CF6] transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#94A3B8] transition-colors">Back to home</Link>
      </div>
    </section>
  );
}
