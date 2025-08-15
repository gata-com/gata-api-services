import nodemailer from 'nodemailer';
import { EmailTemplateLoader } from './templateLoader';

// Setup transporter untuk nodemailer
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true untuk port 465, false untuk port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

export const sendResetPasswordEmail = async (
  email: string, 
  token: string, 
  nama: string
): Promise<boolean> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    // Load template dan replace variables
    const template = EmailTemplateLoader.loadTemplate('reset-password');
    const htmlContent = EmailTemplateLoader.replaceVariables(template, {
      nama,
      resetUrl
    });

    const mailOptions = {
      from: `"GATA System" <${process.env.SMTP_FROM || 'noreply@gata.com'}>`,
      to: email,
      subject: 'Reset Password - GATA System',
      html: htmlContent,
      // Optional: tambahkan text version untuk email client yang tidak support HTML
      text: `
        Halo ${nama},
        
        Anda telah meminta untuk mereset password akun Anda. 
        Klik link berikut untuk mereset password: ${resetUrl}
        
        Link ini akan kedaluwarsa dalam 1 jam.
        
        Jika Anda tidak meminta reset password, abaikan email ini.
        
        Terima kasih,
        GATA System Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent:', result.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

// Optional: Function untuk send email lainnya di masa depan
export const sendWelcomeEmail = async (
  email: string, 
  nama: string
): Promise<boolean> => {
  try {
    // Implementasi welcome email bisa ditambahkan nanti
    console.log(`Welcome email would be sent to ${email} for ${nama}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendNotificationEmail = async (
  email: string, 
  subject: string, 
  message: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"GATA System" <${process.env.SMTP_FROM || 'noreply@gata.com'}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};