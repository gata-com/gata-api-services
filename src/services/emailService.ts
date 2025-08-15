// services/emailService.ts
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Fix: createTransport (bukan createTransporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function untuk load HTML template
const loadTemplate = (templateName: string): string => {
  try {
    const templatePath = path.join(process.cwd(), 'templates', templateName);
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Template ${templateName} tidak ditemukan`);
  }
};

export const sendResetPasswordEmail = async (email: string, token: string, userName?: string): Promise<void> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    // Load HTML template dan replace placeholders sesuai template
    let htmlTemplate = loadTemplate('reset-password.html');
    htmlTemplate = htmlTemplate.replace(/{{resetUrl}}/g, resetUrl); // Replace semua occurrence
    htmlTemplate = htmlTemplate.replace('{{nama}}', userName || 'User');
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password - GATA System",
      text: `Reset Password GATA System. Klik link ini untuk reset password: ${resetUrl}`,
      html: htmlTemplate
    });

    console.log(`Reset password email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw new Error("Gagal mengirim email reset password");
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  try {
    // Load welcome template jika ada, atau fallback ke simple HTML
    let htmlTemplate: string;
    
    try {
      htmlTemplate = loadTemplate('welcome.html');
      htmlTemplate = htmlTemplate.replace('{{name}}', name);
      htmlTemplate = htmlTemplate.replace('{{email}}', email);
    } catch {
      // Fallback jika template welcome tidak ada
      htmlTemplate = `
        <h2>Selamat Datang, ${name}!</h2>
        <p>Registrasi berhasil!</p>
      `;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Selamat Datang!",
      html: htmlTemplate
    });

    console.log(`Welcome email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Gagal mengirim email selamat datang");
  }
};

// Optional: Function untuk test email configuration
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
};