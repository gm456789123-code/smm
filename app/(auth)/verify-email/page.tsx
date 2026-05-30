'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyContent() {
  const params = useSearchParams();
  const success = params.get('success');
  const error = params.get('error');

  if (success) {
    return (
      <div className="glass w-full max-w-sm p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">
          ยืนยัน Email สำเร็จ!
        </h2>
        <p className="text-[#94A3B8] text-sm">บัญชีของคุณพร้อมใช้งานแล้ว</p>
        <Link href="/login" className="glass-tab glass-tab-active block px-6 py-2.5 text-sm font-semibold text-[#c4b5fd]">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const messages: Record<string, string> = {
    invalid: 'ลิงก์ไม่ถูกต้องหรือไม่มีอยู่',
    expired: 'ลิงก์หมดอายุแล้ว (มีอายุ 24 ชั่วโมง)',
    used:    'ลิงก์นี้ถูกใช้ไปแล้ว',
    server:  'เกิดข้อผิดพลาด กรุณาลองใหม่',
  };

  if (error) {
    return (
      <div className="glass w-full max-w-sm p-8 text-center space-y-4">
        <div className="text-5xl">❌</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">
          ยืนยันไม่สำเร็จ
        </h2>
        <p className="text-[#94A3B8] text-sm">{messages[error] ?? 'เกิดข้อผิดพลาด'}</p>
        <Link href="/register" className="glass-tab block px-6 py-2.5 text-sm text-[#94A3B8]">
          สมัครสมาชิกใหม่
        </Link>
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-sm p-8 text-center space-y-4">
      <div className="text-5xl">📧</div>
      <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">
        ตรวจสอบ Email
      </h2>
      <p className="text-[#94A3B8] text-sm">กรุณาคลิกลิงก์ที่ส่งไปยัง email ของคุณ</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
