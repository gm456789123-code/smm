import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
});

const FROM = process.env.SMTP_FROM ?? 'AURA SMM <noreply@example.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'ยืนยัน Email ของคุณ — AURA SMM',
    html: `
      <div style="background:#090D16;color:#F1F5F9;font-family:Inter,sans-serif;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
        <h1 style="color:#8B5CF6;margin:0 0 8px">AURA SMM</h1>
        <p style="color:#94A3B8;margin:0 0 24px;font-size:14px">ยืนยัน Email ของคุณ</p>
        <p style="margin:0 0 24px;font-size:15px">คลิกปุ่มด้านล่างเพื่อยืนยันบัญชีของคุณ ลิงก์มีอายุ <strong>24 ชั่วโมง</strong></p>
        <a href="${link}"
           style="display:inline-block;background:#8B5CF6;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          ยืนยัน Email
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">
          หากไม่ได้สมัครสมาชิก ไม่ต้องดำเนินการใดๆ
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `ยินดีต้อนรับสู่ AURA SMM, ${username}!`,
    html: `
      <div style="background:#090D16;color:#F1F5F9;font-family:Inter,sans-serif;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
        <h1 style="color:#8B5CF6;margin:0 0 8px">AURA SMM</h1>
        <p style="font-size:16px">สวัสดี <strong>${username}</strong>!</p>
        <p style="color:#94A3B8;font-size:14px;">ยืนยัน Email เรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบและเริ่มใช้งานได้เลย</p>
        <a href="${APP_URL}/login"
           style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-top:16px;">
          เข้าสู่ระบบ
        </a>
      </div>
    `,
  });
}
