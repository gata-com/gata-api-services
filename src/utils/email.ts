// utils/email.ts
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Debug environment variables
console.log("=== EMAIL CONFIGURATION DEBUG ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS length:", process.env.SMTP_PASS?.length);
console.log("SMTP_PASS format:", process.env.SMTP_PASS?.replace(/./g, "*"));
console.log("SMTP_FROM:", process.env.SMTP_FROM);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

// Setup transporter untuk nodemailer - IMPROVED CONFIGURATION
const transporter = nodemailer.createTransport({
  service: "gmail", // Menggunakan service predefined Gmail
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App Password
  },
  // Backup manual configuration jika service tidak bekerja
  // host: process.env.SMTP_HOST,
  // port: Number(process.env.SMTP_PORT),
  // secure: false, // true untuk port 465, false untuk port 587
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASS,
  // },
  // tls: {
  //   rejectUnauthorized: false,
  // },
});

// Verify transporter configuration dengan error handling yang lebih baik
const verifyTransporter = async () => {
  try {
    const isReady = await transporter.verify();
    if (isReady) {
      console.log("✅ SMTP server is ready to send emails");
      return true;
    }
  } catch (error: any) {
    console.error("❌ SMTP configuration error:", error.message);

    // Specific error handling
    if (error.code === "EAUTH") {
      console.error("🔐 Authentication failed. Check:");
      console.error("   - Email address is correct");
      console.error("   - App Password is correct (16 characters)");
      console.error("   - 2-Step Verification is enabled");
      console.error("   - App Password was generated recently");
    } else if (error.code === "ECONNECTION") {
      console.error(
        "🌐 Connection failed. Check internet connection and SMTP settings"
      );
    }

    return false;
  }
  return false; // Ensure all code paths return a value
};

// Initialize verification
verifyTransporter();

// Fallback template function
const getDefaultResetTemplate = (): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #dee2e6;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #495057; margin: 0;">GATA System</h1>
                <h2 style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Reset Password</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Halo <strong>{{nama}}</strong>,</p>
            
            <p style="margin-bottom: 20px;">Anda telah meminta untuk mereset password akun Anda di GATA System. Klik tombol di bawah ini untuk melanjutkan:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Reset Password Sekarang
                </a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Penting:</strong> Link ini akan kedaluwarsa dalam <strong>1 jam</strong>.</p>
            </div>
            
            <p style="margin-bottom: 20px;">Jika tombol di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; font-size: 14px;">{{resetUrl}}</p>
            
            <p style="margin-bottom: 20px;">Jika Anda tidak meminta reset password, abaikan email ini dan password Anda akan tetap aman.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #6c757d; margin: 0;">
                    Email ini dikirim otomatis oleh GATA System<br>
                    Jangan balas email ini karena tidak akan terbaca
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Helper function untuk load HTML template
const loadTemplate = (templateName: string): string => {
  try {
    const possiblePaths = [
      path.join(process.cwd(), "templates", templateName),
      path.join(process.cwd(), "src", "templates", templateName),
      path.join(__dirname, "..", "templates", templateName),
      path.join(__dirname, "..", "..", "templates", templateName),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, "utf8");
        return content;
      }
    }

    return getDefaultResetTemplate();
  } catch (error) {
    return getDefaultResetTemplate();
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string,
  nama: string
): Promise<boolean> => {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return false;
    }

    // Verify transporter before sending
    const isTransporterReady = await verifyTransporter();
    if (!isTransporterReady) {
      return false;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Load and prepare HTML content
    let htmlContent = loadTemplate("reset-password.html");
    htmlContent = htmlContent.replace(/{{nama}}/g, nama);
    htmlContent = htmlContent.replace(/{{resetUrl}}/g, resetUrl);

    const mailOptions = {
      from: {
        name: "GATA System",
        address: process.env.SMTP_FROM || process.env.SMTP_USER || "",
      },
      to: email,
      subject: "🔐 Reset Password - GATA System",
      html: htmlContent,
      text: `
Halo ${nama},

Anda telah meminta untuk mereset password akun Anda di GATA System.

Reset Password Link: ${resetUrl}

PENTING: Link ini akan kedaluwarsa dalam 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini.

Terima kasih,
GATA System Team
      `.trim(),
    };
    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    // Detailed error logging
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    if (error.responseCode) {
      console.error("Response Code:", error.responseCode);
    }

    return false;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  nama: string
): Promise<boolean> => {
  try {
    // Verify transporter
    const isReady = await verifyTransporter();
    if (!isReady) {
      console.error("❌ SMTP not ready for welcome email");
      return false;
    }

    let htmlContent: string;

    try {
      htmlContent = loadTemplate("welcome.html");
      htmlContent = htmlContent.replace(/{{nama}}/g, nama);
      htmlContent = htmlContent.replace(/{{email}}/g, email);
    } catch {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745;">🎉 Selamat Datang!</h1>
          </div>
          <h2 style="color: #333;">Halo ${nama}!</h2>
          <p>Terima kasih telah mendaftar di <strong>GATA System</strong>.</p>
          <p>Akun Anda telah berhasil dibuat dan siap digunakan.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Mulai Sekarang
            </a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            Selamat menggunakan GATA System!
          </p>
        </div>
      `;
    }

    const mailOptions = {
      from: {
        name: "GATA System",
        address: process.env.SMTP_FROM || process.env.SMTP_USER || "",
      },
      to: email,
      subject: "🎉 Selamat Datang di GATA System",
      html: htmlContent,
      text: `Selamat datang, ${nama}! Akun Anda di GATA System telah berhasil dibuat dan siap digunakan.`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", result.messageId);
    return true;
  } catch (error: any) {
    console.error("❌ Error sending welcome email:", error.message);
    return false;
  }
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const isReady = await verifyTransporter();
    if (!isReady) return false;

    const mailOptions = {
      from: {
        name: "GATA System",
        address: process.env.SMTP_FROM || process.env.SMTP_USER || "",
      },
      to: email,
      subject: `📢 ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${subject}</h2>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">
            Email dari GATA System - Jangan balas email ini
          </p>
        </div>
      `,
      text: `${subject}\n\n${message}`,
    };

    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error("❌ Error sending notification email:", error.message);
    return false;
  }
};

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    console.log("🔍 Testing email connection...");

    const startTime = Date.now();
    await transporter.verify();
    const endTime = Date.now();

    console.log(
      `✅ Email service is ready and verified! (${endTime - startTime}ms)`
    );
    console.log("📧 SMTP User:", process.env.SMTP_USER);
    console.log("🌐 SMTP Host: smtp.gmail.com (via service config)");

    return true;
  } catch (error: any) {
    console.error("❌ Email service error:", error.message);

    // Provide specific troubleshooting steps
    if (error.code === "EAUTH") {
      console.error("\n🔧 Troubleshooting steps:");
      console.error(
        "1. Check if 2-Step Verification is enabled in Google Account"
      );
      console.error(
        "2. Verify App Password is correct (16 characters, no spaces)"
      );
      console.error("3. Try generating a new App Password");
      console.error("4. Make sure email address is correct");
    }

    return false;
  }
};
