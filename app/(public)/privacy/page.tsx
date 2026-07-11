import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของ AURA SMM',
};

export default function PrivacyPage() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-10">
        <p className="text-xs text-[#8B5CF6] uppercase tracking-widest font-semibold mb-2">Legal</p>
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white mb-2">
          นโยบายความเป็นส่วนตัว
        </h1>
        <p className="text-[#475569] text-sm">มีผลบังคับใช้ตั้งแต่ 1 มกราคม 2568</p>
      </div>

      <div className="space-y-8 text-[#94A3B8] leading-relaxed text-sm">
        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><span className="text-white">ข้อมูลบัญชี:</span> ชื่อผู้ใช้ อีเมล และรหัสผ่าน (เข้ารหัส bcrypt)</li>
            <li><span className="text-white">ข้อมูลการทำธุรกรรม:</span> ประวัติการเติมเงิน ออเดอร์ และการชำระเงิน</li>
            <li><span className="text-white">ข้อมูลการใช้งาน:</span> ลิงก์เป้าหมายที่ใช้สั่งบริการ</li>
            <li><span className="text-white">ข้อมูลการชำระเงิน:</span> เราใช้บริการ EasySlip ในการตรวจสอบสลิป โดยไม่เก็บข้อมูลบัตรหรือข้อมูลธนาคารโดยตรง</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">2. วัตถุประสงค์การใช้ข้อมูล</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>ให้บริการและประมวลผลออเดอร์ของคุณ</li>
            <li>ส่งการแจ้งเตือนและอัปเดตสถานะออเดอร์ผ่านอีเมล</li>
            <li>ตรวจสอบการทุจริตและปกป้องความปลอดภัยของระบบ</li>
            <li>ปรับปรุงคุณภาพบริการและประสบการณ์ผู้ใช้</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">3. การเปิดเผยข้อมูลต่อบุคคลที่สาม</h2>
          <p>เราไม่ขาย เช่า หรือเปิดเผยข้อมูลส่วนบุคคลของคุณต่อบุคคลภายนอก ยกเว้น:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>ผู้ให้บริการ SMM ที่จำเป็นต้องได้รับลิงก์เป้าหมายเพื่อดำเนินการออเดอร์</li>
            <li>บริการ EasySlip เพื่อตรวจสอบสลิปการชำระเงิน</li>
            <li>หน่วยงานรัฐบาลเมื่อมีคำสั่งศาลหรือกฎหมายกำหนด</li>
          </ul>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">4. ความปลอดภัยของข้อมูล</h2>
          <p>เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม ได้แก่ การเข้ารหัสรหัสผ่านด้วย bcrypt, HTTPS, JWT authentication และการจำกัดสิทธิ์การเข้าถึงฐานข้อมูล อย่างไรก็ตาม ไม่มีระบบใดที่ปลอดภัยสมบูรณ์ 100%</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">5. การเก็บรักษาข้อมูล</h2>
          <p>เราเก็บข้อมูลของคุณตราบเท่าที่บัญชียังคงใช้งานอยู่ หรือจำเป็นสำหรับการให้บริการ คุณสามารถขอลบบัญชีได้โดยติดต่อฝ่ายสนับสนุน</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">6. สิทธิ์ของคุณ</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>สิทธิ์เข้าถึงและแก้ไขข้อมูลส่วนบุคคลของคุณ</li>
            <li>สิทธิ์ขอลบข้อมูล (ภายใต้ข้อจำกัดทางกฎหมาย)</li>
            <li>สิทธิ์ขอสำเนาข้อมูลที่เราเก็บ</li>
          </ul>
          <p className="mt-2">กรุณาติดต่อเราผ่านช่องทางในเว็บไซต์เพื่อใช้สิทธิ์เหล่านี้</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">7. คุกกี้</h2>
          <p>เราใช้คุกกี้เพียงสำหรับการยืนยันตัวตน (auth token) เท่านั้น ไม่มีการใช้คุกกี้ติดตามหรือโฆษณา</p>
        </div>

        <div className="glass p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">8. การแก้ไขนโยบาย</h2>
          <p>เราอาจอัปเดตนโยบายนี้ได้ทุกเมื่อ การใช้บริการต่อเนื่องหลังจากมีการอัปเดตถือว่าคุณยอมรับนโยบายใหม่</p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-[#334155]">
        <Link href="/terms" className="hover:text-[#8B5CF6] transition-colors">เงื่อนไขการใช้บริการ</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#94A3B8] transition-colors">กลับหน้าแรก</Link>
      </div>
    </section>
  );
}
