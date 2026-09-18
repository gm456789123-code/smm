import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Refund Policy | นโยบายการคืนเงินและเครดิต | AURA SMM',
  description: 'ข้อกำหนดและนโยบายการคืนเงิน การคืนเครดิตเข้ากระเป๋าอัตโนมัติ สำหรับบริการของ AURA SMM',
  alternates: { canonical: `${SITE_URL}/refund` },
  openGraph: {
    title: 'Refund Policy | AURA SMM',
    description: 'ข้อกำหนดและนโยบายการคืนเงิน การคืนเครดิตเข้ากระเป๋าอัตโนมัติ สำหรับบริการของ AURA SMM',
    url: `${SITE_URL}/refund`,
  },
};

export default function RefundPage() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-10">
        <p className="text-xs text-[#8B5CF6] uppercase tracking-widest font-semibold mb-2">Legal & Compliance</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white mb-2">
          นโยบายการคืนเงินและเครดิต (Refund Policy)
        </h1>
        <p className="text-[#94A3B8] text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568 เป็นต้นไป</p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            1. การคืนเครดิตเข้ากระเป๋าเงินอัตโนมัติ (Auto-Refund to Balance)
          </h2>
          <p>
            ทาง AURA SMM ให้ความสำคัญกับความถูกต้องและความพึงพอใจของผู้ใช้งาน หากคำสั่งซื้อเกิดข้อผิดพลาดจากระบบ หรือไม่สามารถส่งมอบงานได้ครบถ้วน ระบบจะดำเนินการคืนเครดิตเข้ากระเป๋าเงินของผู้ใช้โดยอัตโนมัติ:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>คำสั่งซื้อถูกยกเลิก (Cancelled):</strong> ระบบจะคืนเครดิตเข้ากระเป๋าเงินเต็มจำนวนที่ตัดไปทันที
            </li>
            <li>
              <strong>คำสั่งซื้อเสร็จสิ้นบางส่วน (Partial):</strong> หากระบบส่งมอบยอดได้ไม่ครบตามที่สั่ง ระบบจะคำนวณคืนเครดิตตามสัดส่วนยอดที่ค้างส่งมอบเข้ากระเป๋าเงินทันที
            </li>
            <li>
              <strong>ระบบผู้ให้บริการขัดข้อง:</strong> หากระบบปลายทางไม่สามารถรับคำสั่งซื้อได้ เครดิตจะถูก Rollback คืนเข้าบัญชีโดยอัตโนมัติ
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            2. เงื่อนไขการเติมเงินเครดิตเข้ากระเป๋า (Wallet Top-up)
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ยอดเงินที่เติมเข้ามาในระบบผ่านพร้อมเพย์ บัตรเครดิต/เดบิต Google Pay, Apple Pay, Link หรือทรูมันนี่ จะถูกแปลงเป็น <strong>เครดิตในระบบ (Credits)</strong> สำหรับใช้สั่งซื้อบริการบนแพลตฟอร์ม
            </li>
            <li>
              เครดิตที่เติมเข้ามาแล้วไม่สามารถถอน แลกเปลี่ยนเป็นเงินสด หรือโอนย้ายข้ามบัญชีผู้ใช้งานได้ ยกเว้นกรณีความผิดพลาดจากการตัดเงินซ้ำซ้อนของระบบชำระเงิน
            </li>
            <li>
              สำหรับการชำระผ่านบัตรเครดิต เดบิต Google Pay, Apple Pay และ Link ระบบมีค่าธรรมเนียมการทำรายการคงที่ <strong>-8 เครดิต</strong> ต่อครั้ง และมียอดชำระขั้นต่ำ <strong>฿200 บาท</strong>
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            3. กรณีที่ไม่สามารถขอคืนเงินหรือเครดิตได้
          </h2>
          <p>ทางระบบขอสงวนสิทธิ์ไม่สามารถคืนเครดิตได้ในกรณีต่อไปนี้:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ผู้ใช้งานระบุ <strong>Link / URL ผิดพลาด</strong> หรือลิงก์ใช้งานไม่ได้
            </li>
            <li>
              บัญชีปลายทางถูกตั้งค่าเป็น <strong>ส่วนตัว (Private Account)</strong> ในระหว่างที่คำสั่งซื้อกำลังดำเนินการ
            </li>
            <li>
              ผู้ใช้งานทำการสั่งซื้อซ้ำซ้อนในลิงก์เดียวกันกับบริการเดียวกันก่อนที่คำสั่งซื้อเดิมจะเสร็จสิ้น
            </li>
            <li>
              โพสต์หรือบัญชีปลายทางถูกลบหรือระงับโดยแพลตฟอร์มโซเชียลมีเดียเอง (เช่น โดนลบโดย Facebook, IG, TikTok, YouTube)
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            4. การติดต่อขอความช่วยเหลือ
          </h2>
          <p>
            หากท่านพบปัญหาเกี่ยวกับคำสั่งซื้อ หรือมียอดเงินที่ถูกตัดซ้ำซ้อน ท่านสามารถติดต่อทีมงานเพื่อตรวจสอบได้ตลอด 24 ชั่วโมง ผ่านทาง:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>ระบบตั๋วแจ้งปัญหา (Ticket Support) ในแดชบอร์ด</li>
            <li>ฝ่ายบริการลูกค้าผ่านช่องทาง LINE Official ของทางเว็บไซต์</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#94A3B8]">
        <Link href="/terms" className="hover:text-white transition-colors">เงื่อนไขการให้บริการ (Terms)</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว (Privacy)</Link>
        <span>·</span>
        <Link href="/" className="hover:text-white transition-colors">กลับหน้าหลัก</Link>
      </div>
    </section>
  );
}
