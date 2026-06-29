import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface SendEmailOptions {
  recipients: string[];
  html: string;
  subject: string;
  attachments?: string[];
  cc?: string[];
  bcc?: string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { recipients, html, subject, attachments = [], cc = [], bcc = [] } = options;

    const resolvedAttachments = attachments.map((filePath) => {
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Attachment not found: ${absolutePath}`);
      }
      return {
        filename: path.basename(absolutePath),
        path: absolutePath,
      };
    });

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipients,
      cc,
      bcc,
      subject,
      html,
      attachments: resolvedAttachments,
    });

    this.logger.log(`Email sent to ${recipients.join(', ')}`);
  }
}
