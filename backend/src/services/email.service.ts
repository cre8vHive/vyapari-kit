import { config } from '../config';
import { Logger } from './logger.service';
import { welcomeTemplate, verificationTemplate, passwordResetTemplate } from './email.templates';

export class EmailService {
  private static readonly BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

  private static async send(to: { name: string; email: string }, subject: string, htmlContent: string) {
    if (!config.brevoApiKey) {
      Logger.warn(`BREVO_API_KEY is not configured. Simulating email to ${to.email}`, { subject });
      return;
    }

    try {
      const response = await fetch(this.BREVO_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Vyapari Kit', email: config.emailSender },
          to: [{ email: to.email, name: to.name }],
          subject,
          htmlContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
      }

      Logger.info(`Email sent successfully to ${to.email}`, { subject });
    } catch (error) {
      Logger.error(`Failed to send email to ${to.email}`, error, { subject });
    }
  }

  static async sendWelcome(user: { name: string; email: string }) {
    const html = welcomeTemplate(user.name);
    await this.send(user, 'Welcome to Vyapari Kit', html);
  }

  static async sendVerification(user: { name: string; email: string }, token: string) {
    // Construct the verification link based on frontend URL
    const frontendUrl = config.clientOrigins[0] || 'http://localhost:5173';
    const link = `${frontendUrl}/verify-email?token=${token}`;
    const html = verificationTemplate(user.name, link);
    await this.send(user, 'Verify your email address', html);
  }

  static async sendPasswordReset(user: { name: string; email: string }, token: string) {
    const frontendUrl = config.clientOrigins[0] || 'http://localhost:5173';
    const link = `${frontendUrl}/reset-password?token=${token}`;
    const html = passwordResetTemplate(user.name, link);
    await this.send(user, 'Password Reset Request', html);
  }
}
