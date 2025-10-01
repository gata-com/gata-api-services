// services/emailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Fix: createTransport (bukan createTransporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // koneksi reusable
});

const getHtmlTemplate = (
  userName: string | undefined,
  resetUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password - GATA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Container utama -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; max-width: 100%;">
          
          <!-- Header dengan gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #4e73ff 0%, #5b5fd8 100%); padding: 40px 30px; text-align: center;">
              <div style="background: white; width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <span style="font-size: 40px; color: #4e73ff;">🔐</span>
              </div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Reset Password</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">GATA - Administrasi Tugas Akhir</p>
            </td>
          </tr>
          
          <!-- Konten -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 22px;">Halo, ${
                userName || "User"
              }!</h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Kami menerima permintaan untuk mereset password akun Anda di sistem <strong>GATA</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Klik tombol di bawah untuk membuat password baru:
              </p>
              
              <!-- Tombol CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4e73ff 0%, #5b5fd8 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(78, 115, 255, 0.3); transition: all 0.3s;">
                      Reset Password Saya
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info box -->
              <div style="margin: 30px 0; padding: 20px; background: #fff5e6; border-left: 4px solid #ff9800; border-radius: 4px;">
                <p style="margin: 0; color: #e65100; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ PENTING:</strong> Link ini akan kedaluwarsa dalam <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini dan akun Anda akan tetap aman.
                </p>
              </div>
              
              <!-- Link alternatif -->
              <p style="margin: 20px 0 0; color: #718096; font-size: 13px; line-height: 1.6;">
                Jika tombol di atas tidak berfungsi, salin dan paste link berikut ke browser Anda:<br/>
                <a href="${resetUrl}" style="color: #4e73ff; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #2d3748; font-size: 14px; font-weight: 600;">
                Tim GATA System
              </p>
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Portal Administrasi Tugas Akhir<br/>
                Email ini dikirim secara otomatis, mohon tidak membalas.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Copyright -->
        <p style="margin: 20px 0 0; color: rgba(255,255,255,0.8); font-size: 12px; text-align: center;">
          © 2025 GATA System. All rights reserved.
        </p>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `;
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<boolean> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    // Load HTML template
    const htmlContent = getHtmlTemplate(userName, resetUrl);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "🔐 Reset Password - GATA System",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return false;
  }
};
