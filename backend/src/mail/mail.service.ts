import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private transporter() {
    return nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT')),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.config.get<string>('APP_URL');
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    const smtpUser = this.config.get<string>('SMTP_USER');

    if (!smtpUser || smtpUser === 'your_mailtrap_user') {
      this.logger.warn(`Email not sent. Verification URL: ${verifyUrl}`);
      return;
    }

    await this.transporter().sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: email,
      subject: 'Verify your Stock Challenge account',
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${verifyUrl}">Verify Email</a>
      `,
    });
  }
}
