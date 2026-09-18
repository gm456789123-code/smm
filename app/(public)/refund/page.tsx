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
          นโยบายการคืนเงินและเครดิต (Refund & Credit Policy)
        </h1>
        <p className="text-[#94A3B8] text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568 เป็นต้นไป</p>
      </div>

      {/* กล่องไฮไลท์สำคัญที่สุด */}
      <div className="mb-8 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs sm:text-sm space-y-2 leading-relaxed">
        <p className="font-bold text-white text-base flex items-center gap-2">
          ⚠️ ข้อชี้แจงสำคัญเกี่ยวกับนโยบายการคืนเงิน
        </p>
        <p>
          ทางระบบ <strong>ไม่มีนโยบายการคืนเงินเป็นเงินสด โอนกลับบัญชีธนาคาร หรือคืนกลับเข้าบัตรเครดิตทุกกรณี</strong> เมื่อทำการเติมเงินเข้ามาในระบบเรียบร้อยแล้ว
        </p>
        <p className="text-amber-300 font-semibold">
          อย่างไรก็ตาม หากคำสั่งซื้อเกิดปัญหา ระบบขัดข้อง ไม่สามารถส่งมอบงานได้ หรือส่งมอบได้ไม่ครบถ้วน ระบบจะดำเนินการคืนยอดเงินเต็มจำนวนเป็น &ldquo;เครดิตในระบบ (Credits)&rdquo; เข้าสู่กระเป๋าเงินของคุณโดยอัตโนมัติทันที 100% เพื่อให้คุณนำไปใช้สั่งซื้อบริการใหม่ได้ตลอด 24 ชั่วโมง
        </p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            1. การคืนเครดิตเข้ากระเป๋าเงินเมื่อเกิดปัญหา (Refund as Credits Only)
          </h2>
          <p>
            เพื่อความพึงพอใจและความปลอดภัยสูงสุดของผู้ใช้งาน หากเกิดปัญหาเกี่ยวกับคำสั่งซื้อ ระบบจะคืนเป็น <strong>เครดิต (Credits)</strong> เข้ากระเป๋าบัญชีของคุณโดยอัตโนมัติในกรณีดังต่อไปนี้:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>คำสั่งซื้อถูกยกเลิก (Cancelled):</strong> หากระบบหรือผู้ให้บริการไม่สามารถประมวลผลคำสั่งซื้อได้ ยอดเครดิตทั้งหมดจะถูกโอนคืนเข้ากระเป๋าเงินของคุณทันที 100%
            </li>
            <li>
              <strong>คำสั่งซื้อส่งมอบไม่ครบ (Partial):</strong> หากระบบส่งยอดได้เพียงบางส่วน ระบบจะคำนวณยอดคงค้างและคืนเครดิตตามสัดส่วนที่เหลือเข้าบัญชีของคุณทันทีอัตโนมัติ
            </li>
            <li>
              <strong>ระบบเซิร์ฟเวอร์ขัดข้อง:</strong> หากเกิดข้อผิดพลาดทางเทคนิคที่ทำให้คำสั่งซื้อไม่เริ่มทำงาน ระบบจะ Rollback คืนเครดิตเข้ากระเป๋าเงินทันที
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            2. เงื่อนไขการเติมเงินและการไม่คืนเงินสด (Non-refundable to Cash/Bank)
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ยอดเงินทุกบาทที่เติมเข้ามาผ่าน พร้อมเพย์, บัตรเครดิต/เดบิต, Google Pay หรือ TrueMoney จะถูกแปลงเป็น <strong>เครดิตสำหรับใช้งานบนแพลตฟอร์มทันที</strong>
            </li>
            <li>
              <strong>ไม่สามารถขอถอน แลกเปลี่ยนเป็นเงินสด หรือโอนกลับเข้าบัญชีธนาคาร/บัตรได้ทุกกรณี</strong> ขอให้ผู้ใช้งานวางแผนการเติมเงินให้พอดีกับการใช้งานจริง
            </li>
            <li>
              เครดิตในบัญชีไม่มีวันหมดอายุ สามารถเก็บไว้ใช้งานเมื่อใดก็ได้ตามต้องการ
            </li>
            <li>
              สำหรับการเติมผ่านบัตรเครดิต เดบิต และ Google Pay มีการหักค่าธรรมเนียมคงที่ <strong>-8 เครดิต</strong> ต่อรายการ และมียอดชำระขั้นต่ำ <strong>฿200 บาท</strong>
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            3. การรับประกันบริการและการเติมซ้ำ (Refill Guarantee)
          </h2>
          <p>
            สำหรับบริการที่มีระบุการรับประกันหรือป้าย <strong>Refill</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              หากยอดมีการลดลงภายในระยะเวลาที่รับประกัน (เช่น 30 วัน หรือตามที่แพ็กเกจระบุ) ผู้ใช้สามารถกดปุ่ม <strong>&ldquo;Refill (เติมซ้ำ)&rdquo;</strong> ได้ที่หน้ารายการสั่งซื้อ (My Orders) เพื่อให้ระบบส่งยอดเติมชดเชยให้ฟรี
            </li>
            <li>
              บริการที่ไม่มีระบุ Refill จะไม่มีการรับประกันการลดลงของยอดหลังจากส่งมอบงานเรียบร้อยแล้ว
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            4. ข้อยกเว้นที่ไม่สามารถขอคืนเครดิตได้
          </h2>
          <p>ระบบขอสงวนสิทธิ์ในการไม่คืนเครดิตในกรณีที่เกิดจากความผิดพลาดของผู้ใช้งานเอง ดังนี้:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ผู้ใช้งานระบุ <strong>Link / URL ผิด</strong> หรือใส่ลิงก์ที่ไม่ถูกต้อง
            </li>
            <li>
              บัญชีปลายทางถูกตั้งค่าเป็น <strong>ส่วนตัว (Private Account)</strong> ระหว่างที่คำสั่งซื้อกำลังดำเนินการ
            </li>
            <li>
              ผู้ใช้งานทำการ <strong>เปลี่ยนชื่อผู้ใช้ (Username) หรือลบโพสต์</strong> ในระหว่างที่คำสั่งซื้อยังไม่เสร็จสิ้น
            </li>
            <li>
              ผู้ใช้งานสั่งซื้อบริการซ้ำซ้อนในลิงก์เดียวกันก่อนที่ออเดอร์เดิมจะทำงานเสร็จสิ้น
            </li>
          </ul>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            5. การติดต่อสอบถามและแจ้งปัญหา
          </h2>
          <p>
            หากท่านพบว่าออเดอร์มีปัญหา หรือระบบยังไม่ได้คืนเครดิตตามเงื่อนไข ท่านสามารถติดต่อทีมงานเพื่อตรวจสอบได้ตลอด 24 ชั่วโมง:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>เปิดตั๋วแจ้งปัญหาผ่านระบบ <strong>Ticket Support</strong> ในแดชบอร์ด</li>
            <li>ติดต่อฝ่ายบริการลูกค้าผ่านทาง <strong>LINE Official</strong> ของทางเว็บไซต์</li>
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
