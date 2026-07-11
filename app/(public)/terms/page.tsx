import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'เงื่อนไขการใช้บริการ',
  description: 'ข้อกำหนดและเงื่อนไขการใช้บริการ AURA SMM',
};

export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-10">
        <p className="text-xs text-[#8B5CF6] uppercase tracking-widest font-semibold mb-2">Legal</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white mb-2">
          เงื่อนไขการใช้บริการ
        </h1>
        <p className="text-[#475569] text-sm">มีผลบังคับใช้ตั้งแต่ 1 มกราคม 2568</p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">1. การยอมรับเงื่อนไข</h2>
          <p>การเข้าใช้งานหรือสมัครบัญชีบน AURA SMM ถือว่าคุณได้อ่านและยอมรับข้อกำหนดและเงื่อนไขเหล่านี้ทั้งหมดแล้ว หากคุณไม่เห็นด้วยกับส่วนใดส่วนหนึ่ง กรุณางดใช้บริการ</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">2. บริการที่ให้</h2>
          <p>AURA SMM ให้บริการเพิ่มผู้ติดตาม ยอดไลก์ ยอดวิว และ engagement บนโซเชียลมีเดีย ผ่านระบบอัตโนมัติ เราสงวนสิทธิ์ปรับปรุง แก้ไข หรือหยุดให้บริการใดๆ ได้ทุกเมื่อโดยไม่ต้องแจ้งล่วงหน้า</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">3. นโยบายการเงินและการคืนเงิน</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>เครดิตที่เติมเข้าระบบแล้ว <span className="text-white font-medium">ไม่สามารถขอคืนเงินได้</span>ไม่ว่ากรณีใดทั้งสิ้น</li>
            <li>ราคาบริการอาจเปลี่ยนแปลงได้โดยไม่แจ้งล่วงหน้า เครดิตคงเหลือไม่ได้รับผลกระทบ</li>
            <li>ออเดอร์ที่ส่งแล้วและอยู่ระหว่างดำเนินการ ไม่สามารถยกเลิกได้ ยกเว้นบริการที่ระบุว่ารองรับ Cancel</li>
            <li>กรณีออเดอร์ไม่สำเร็จเนื่องจากข้อผิดพลาดของระบบ เราจะคืนเครดิตเข้าบัญชีภายใน 24–72 ชั่วโมง</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">4. ความรับผิดชอบของผู้ใช้</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>คุณรับผิดชอบต่อการใช้งานบัญชีและต้องรักษาความลับของรหัสผ่าน</li>
            <li>ห้ามใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย หลอกลวง หรือก่อให้เกิดความเสียหายต่อผู้อื่น</li>
            <li>ห้ามพยายามเจาะระบบ โจมตี หรือรบกวนการทำงานของเว็บไซต์</li>
            <li>ผู้ใช้ต้องมีอายุครบ 18 ปีบริบูรณ์หรือได้รับอนุญาตจากผู้ปกครอง</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">5. การยกเว้นความรับผิดชอบ</h2>
          <p>AURA SMM ไม่รับประกันผลลัพธ์ใดๆ จากการใช้บริการ บริการทั้งหมดเป็น "as-is" ตามที่ระบุในหน้าบริการ อาจมีความล่าช้าหรือข้อผิดพลาดจากผู้ให้บริการภายนอก เราไม่รับผิดชอบต่อความเสียหายทางตรงหรือทางอ้อมที่เกิดจากการใช้บริการ</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">6. การระงับบัญชี</h2>
          <p>เราสงวนสิทธิ์ระงับหรือยกเลิกบัญชีที่ละเมิดข้อกำหนดเหล่านี้ หรือกระทำการที่ส่งผลเสียต่อระบบหรือผู้ใช้รายอื่น โดยไม่ต้องแจ้งล่วงหน้าและไม่มีการคืนเครดิตคงเหลือ</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">7. การแก้ไขข้อกำหนด</h2>
          <p>เราอาจแก้ไขข้อกำหนดเหล่านี้ได้ทุกเมื่อ การใช้บริการต่อหลังจากมีการแก้ไขถือว่าคุณยอมรับข้อกำหนดใหม่</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">8. การติดต่อ</h2>
          <p>หากมีคำถามหรือข้อสงสัย กรุณาติดต่อเราผ่านช่องทางที่ระบุในเว็บไซต์</p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#334155]">
        <Link href="/privacy" className="hover:text-[#8B5CF6] transition-colors">นโยบายความเป็นส่วนตัว</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#94A3B8] transition-colors">กลับหน้าแรก</Link>
      </div>
    </section>
  );
}
