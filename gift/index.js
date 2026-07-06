const lib = require("@prakrit_m/tmn-voucher");
const redeemvouchers = lib.default || lib;

function normalizePhone(input) {
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("66") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  if (!/^0\d{9}$/.test(digits)) {
    throw new Error("Phone number must be 10 digits starting with 0 (e.g., 0812345678)");
  }
  return digits;
}

function extractVoucherCode(input) {
  const s = String(input).trim();
  const m = s.match(/[?&]v=([A-Za-z0-9]+)/);
  return m ? m[1] : s;
}

function buildVoucherUrl(code) {
  return `https://gift.truemoney.com/campaign/?v=${code}`;
}

async function redeemRaw(phoneRaw, voucherRaw) {
  const phone = normalizePhone(phoneRaw);
  const code = extractVoucherCode(voucherRaw);

  if (!/^[A-Za-z0-9]+$/.test(code)) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Voucher code must be alphanumeric."
    };
  }

  const url = buildVoucherUrl(code);

  try {
    const r1 = await redeemvouchers(phone, url);
    if (r1?.code !== "INVALID_INPUT") return r1;
  } catch (e) {
    const data = e?.response?.data;
    if (data && data.code !== "INVALID_INPUT") return data;
  }

  try {
    const r2 = await redeemvouchers(phone, code);
    return r2;
  } catch (e) {
    return (
      e?.response?.data || {
        success: false,
        code: "ERROR",
        message: e?.message || "Request error"
      }
    );
  }
}


(async () => {
  const phone = "0812345678"; //  ใส่เบอร์โทร
  const voucher = "https://gift.truemoney.com/campaign/?v=ABCDEFG123"; // ลิ้งซองอังเปา

  try {
    const result = await redeemRaw(phone, voucher);
    console.log(result);
  } catch (err) {
    console.error(err.message);
  }
})();
