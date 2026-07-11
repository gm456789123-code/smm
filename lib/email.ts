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

export async function sendTopupEmail(email: string, username: string, amount: number, ref: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `เติมเงินสำเร็จ ฿${amount.toLocaleString()} — AURA SMM`,
    html: `
      <div style="background:#090D16;color:#F1F5F9;font-family:Inter,sans-serif;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
        <h1 style="color:#8B5CF6;margin:0 0 8px">AURA SMM</h1>
        <p style="color:#94A3B8;margin:0 0 24px;font-size:14px">แจ้งเตือนการเติมเงิน</p>
        <p style="margin:0 0 8px;font-size:15px">สวัสดี <strong>${username}</strong>!</p>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">บัญชีของคุณได้รับการเติมเงินแล้ว</p>
        <div style="background:#0F172A;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">ยอดที่เติม</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:#06B6D4;">฿${amount.toLocaleString()}</p>
          <p style="margin:8px 0 0;color:#475569;font-size:12px;">Ref: ${ref}</p>
        </div>
        <a href="${APP_URL}/topup"
           style="display:inline-block;background:#8B5CF6;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          ดูยอดคงเหลือ
        </a>
        <p style="color:#334155;font-size:12px;margin-top:32px;">หากไม่ได้ทำรายการนี้ กรุณาติดต่อทีมงานทันที</p>
      </div>
    `,
  });
}

export async function sendOrderCompleteEmail(
  email: string, username: string, serviceName: string, orderId: string, amount: number
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `ออเดอร์ #${orderId} เสร็จสมบูรณ์ — AURA SMM`,
    html: `
      <div style="background:#090D16;color:#F1F5F9;font-family:Inter,sans-serif;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
        <h1 style="color:#8B5CF6;margin:0 0 8px">AURA SMM</h1>
        <p style="color:#94A3B8;margin:0 0 24px;font-size:14px">แจ้งเตือนออเดอร์</p>
        <p style="margin:0 0 8px;font-size:15px">สวัสดี <strong>${username}</strong>!</p>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">ออเดอร์ของคุณดำเนินการเสร็จสมบูรณ์แล้ว</p>
        <div style="background:#0F172A;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">ออเดอร์ #${orderId}</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#F1F5F9;">${serviceName}</p>
          <p style="margin:0;color:#10B981;font-size:13px;">✓ เสร็จสมบูรณ์ · ฿${amount.toFixed(2)}</p>
        </div>
        <a href="${APP_URL}/orders"
           style="display:inline-block;background:#10B981;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          ดูออเดอร์
        </a>
      </div>
    `,
  });
}

export async function sendAngpaoPendingAdminEmail(
  adminEmail: string,
  username: string,
  code: string,
): Promise<void> {
  const APP_URL_LOCAL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `⚠️ ซองอั้งเปารอตรวจสอบ — ${username}`,
    html: `
      <div style="background:#090D16;color:#F1F5F9;font-family:Inter,sans-serif;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
        <h1 style="color:#8B5CF6;margin:0 0 8px">AURA SMM</h1>
        <p style="color:#94A3B8;margin:0 0 16px;font-size:14px">มีซองอั้งเปาที่รอการตรวจสอบ</p>
        <div style="background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.4);border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0 0 6px;font-size:13px;color:#94A3B8;">ผู้ส่ง</p>
          <p style="margin:0 0 14px;font-size:16px;font-weight:600;">${username}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#94A3B8;">รหัสซอง</p>
          <p style="margin:0;font-size:14px;font-family:monospace;word-break:break-all;">${code}</p>
        </div>
        <p style="color:#94A3B8;font-size:13px;">กรุณาแลกซองใน TrueMoney Wallet แล้วอนุมัติในหน้า Admin</p>
        <a href="${APP_URL_LOCAL}/admin/angpao"
           style="display:inline-block;background:#fb923c;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">
          จัดการซองอั้งเปา
        </a>
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

