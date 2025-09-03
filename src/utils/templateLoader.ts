import fs from 'fs';
import path from 'path';

export class EmailTemplateLoader {
  private static templateCache: Map<string, string> = new Map();

  static loadTemplate(templateName: string): string {
    // Check cache first for performance
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      const template = fs.readFileSync(templatePath, 'utf8');
      
      // Cache the template
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      // Fallback ke template sederhana
      return this.getFallbackTemplate();
    }
  }

  static replaceVariables(template: string, variables: Record<string, string>): string {
    let processedTemplate = template;
    
    // Replace semua variabel dengan format {{variableName}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, variables[key]);
    });

    return processedTemplate;
  }

  private static getFallbackTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Password - GATA System</h2>
        <p>Halo {{nama}},</p>
        <p>Silakan klik link berikut untuk reset password Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p><strong>Link ini akan kedaluwarsa dalam 1 jam.</strong></p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `;
  }

  // Method untuk clear cache jika diperlukan
  static clearCache(): void {
    this.templateCache.clear();
  }
}