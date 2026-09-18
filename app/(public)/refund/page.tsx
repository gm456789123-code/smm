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
        <p className="text-xs text-[#7C3AED] uppercase tracking-widest font-bold mb-2">Legal & Compliance</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold text-[#2D1B4E] mb-2">
          นโยบายการคืนเงินและเครดิต (Refund & Credit Policy)
        </h1>
        <p className="text-[#6B5B82] text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568 เป็นต้นไป</p>
      </div>

      {/* กล่องไฮไลท์สำคัญที่สุด */}
      <div className="mb-8 p-6 rounded-2xl border-2 border-amber-300/80 bg-amber-50/95 shadow-sm text-amber-950 text-sm sm:text-base space-y-3 leading-relaxed">
        <p className="font-bold text-amber-950 text-base sm:text-lg flex items-center gap-2">
          ⚠️ ข้อชี้แจงสำคัญเกี่ยวกับนโยบายการคืนเงิน
        </p>
        <p className="text-amber-950 font-medium">
          ทางระบบ <strong>ไม่มีนโยบายการคืนเงินเป็นเงินสด โอนกลับบัญชีธนาคาร หรือคืนกลับเข้าบัตรเครดิตทุกกรณี</strong> เมื่อทำการเติมเงินเข้ามาในระบบเรียบร้อยแล้ว
        </p>
        <div className="p-3.5 rounded-xl bg-amber-100/90 border border-amber-200 text-amber-950 font-semibold text-sm">
          💡 อย่างไรก็ตาม หากคำสั่งซื้อเกิดปัญหา ระบบขัดข้อง ไม่สามารถส่งมอบงานได้ หรือส่งมอบได้ไม่ครบถ้วน ระบบจะดำเนินการคืนยอดเงินเต็มจำนวนเป็น &ldquo;เครดิตในระบบ (Credits)&rdquo; เข้าสู่กระเป๋าเงินของคุณโดยอัตโนมัติทันที 100% เพื่อให้คุณนำไปใช้สั่งซื้อบริการใหม่ได้ตลอด 24 ชั่วโมง
        </div>
      </div>

      <div className="space-y-6 text-[#4A3B63] leading-relaxed text-sm sm:text-base">
        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            1. การคืนเครดิตเข้ากระเป๋าเงินเมื่อเกิดปัญหา (Refund as Credits Only)
          </h2>
          <p>
            เพื่อความพึงพอใจและความปลอดภัยสูงสุดของผู้ใช้งาน หากเกิดปัญหาเกี่ยวกับคำสั่งซื้อ ระบบจะคืนเป็น <strong className="text-[#2D1B4E]">เครดิต (Credits)</strong> เข้ากระเป๋าบัญชีของคุณโดยอัตโนมัติในกรณีดังต่อไปนี้:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[#2D1B4E]">คำสั่งซื้อถูกยกเลิก (Cancelled):</strong> หากระบบหรือผู้ให้บริการไม่สามารถประมวลผลคำสั่งซื้อได้ ยอดเครดิตทั้งหมดจะถูกโอนคืนเข้ากระเป๋าเงินของคุณทันที 100%
            </li>
            <li>
              <strong className="text-[#2D1B4E]">คำสั่งซื้อส่งมอบไม่ครบ (Partial):</strong> หากระบบส่งยอดได้เพียงบางส่วน ระบบจะคำนวณยอดคงค้างและคืนเครดิตตามสัดส่วนที่เหลือเข้าบัญชีของคุณทันทีอัตโนมัติ
            </li>
            <li>
              <strong className="text-[#2D1B4E]">ระบบเซิร์ฟเวอร์ขัดข้อง:</strong> หากเกิดข้อผิดพลาดทางเทคนิคที่ทำให้คำสั่งซื้อไม่เริ่มทำงาน ระบบจะ Rollback คืนเครดิตเข้ากระเป๋าเงินทันที
            </li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            2. เงื่อนไขการเติมเงินและการไม่คืนเงินสด (Non-refundable to Cash/Bank)
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ยอดเงินทุกบาทที่เติมเข้ามาผ่าน พร้อมเพย์, บัตรเครดิต/เดบิต, Google Pay หรือ TrueMoney จะถูกแปลงเป็น <strong className="text-[#2D1B4E]">เครดิตสำหรับใช้งานบนแพลตฟอร์มทันที</strong>
            </li>
            <li>
              <strong className="text-[#2D1B4E]">ไม่สามารถขอถอน แลกเปลี่ยนเป็นเงินสด หรือโอนกลับเข้าบัญชีธนาคาร/บัตรได้ทุกกรณี</strong> ขอให้ผู้ใช้งานวางแผนการเติมเงินให้พอดีกับการใช้งานจริง
            </li>
            <li>
              เครดิตในบัญชีไม่มีวันหมดอายุ สามารถเก็บไว้ใช้งานเมื่อใดก็ได้ตามต้องการ
            </li>
            <li>
              สำหรับการเติมผ่านบัตรเครดิต เดบิต และ Google Pay มีการหักค่าธรรมเนียมคงที่ <strong className="text-[#2D1B4E]">-8 เครดิต</strong> ต่อรายการ และมียอดชำระขั้นต่ำ <strong className="text-[#2D1B4E]">฿200 บาท</strong>
            </li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            3. การรับประกันบริการและการเติมซ้ำ (Refill Guarantee)
          </h2>
          <p>
            สำหรับบริการที่มีระบุการรับประกันหรือป้าย <strong className="text-[#2D1B4E]">Refill</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              หากยอดมีการลดลงภายในระยะเวลาที่รับประกัน (เช่น 30 วัน หรือตามที่แพ็กเกจระบุ) ผู้ใช้สามารถกดปุ่ม <strong className="text-[#2D1B4E]">&ldquo;Refill (เติมซ้ำ)&rdquo;</strong> ได้ที่หน้ารายการสั่งซื้อ (My Orders) เพื่อให้ระบบส่งยอดเติมชดเชยให้ฟรี
            </li>
            <li>
              บริการที่ไม่มีระบุ Refill จะไม่มีการรับประกันการลดลงของยอดหลังจากส่งมอบงานเรียบร้อยแล้ว
            </li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            4. ข้อยกเว้นที่ไม่สามารถขอคืนเครดิตได้
          </h2>
          <p>ระบบขอสงวนสิทธิ์ในการไม่คืนเครดิตในกรณีที่เกิดจากความผิดพลาดของผู้ใช้งานเอง ดังนี้:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              ผู้ใช้งานระบุ <strong className="text-[#2D1B4E]">Link / URL ผิด</strong> หรือใส่ลิงก์ที่ไม่ถูกต้อง
            </li>
            <li>
              บัญชีปลายทางถูกตั้งค่าเป็น <strong className="text-[#2D1B4E]">ส่วนตัว (Private Account)</strong> ระหว่างที่คำสั่งซื้อกำลังดำเนินการ
            </li>
            <li>
              ผู้ใช้งานทำการ <strong className="text-[#2D1B4E]">เปลี่ยนชื่อผู้ใช้ (Username) หรือลบโพสต์</strong> ในระหว่างที่คำสั่งซื้อยังไม่เสร็จสิ้น
            </li>
            <li>
              ผู้ใช้งานสั่งซื้อบริการซ้ำซ้อนในลิงก์เดียวกันก่อนที่ออเดอร์เดิมจะทำงานเสร็จสิ้น
            </li>
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-[#2D1B4E] font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            5. การติดต่อสอบถามและแจ้งปัญหา
          </h2>
          <p>
            หากท่านพบว่าออเดอร์มีปัญหา หรือระบบยังไม่ได้คืนเครดิตตามเงื่อนไข ท่านสามารถติดต่อทีมงานเพื่อตรวจสอบได้ตลอด 24 ชั่วโมง:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>เปิดตั๋วแจ้งปัญหาผ่านระบบ <strong className="text-[#2D1B4E]">Ticket Support</strong> ในแดชบอร์ด</li>
            <li>ติดต่อฝ่ายบริการลูกค้าผ่านทาง <strong className="text-[#2D1B4E]">LINE Official</strong> ของทางเว็บไซต์</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#6B5B82] font-medium">
        <Link href="/terms" className="hover:text-[#2D1B4E] transition-colors">เงื่อนไขการให้บริการ (Terms)</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[#2D1B4E] transition-colors">นโยบายความเป็นส่วนตัว (Privacy)</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#2D1B4E] transition-colors">กลับหน้าหลัก</Link>
      </div>
    </section>
  );
}
