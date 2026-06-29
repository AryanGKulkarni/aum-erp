import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async sendEmailToken(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No account found with this email');

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '10m' },
    );

    const loginUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;
    const templatePath = path.join(__dirname, '../html/token_email.html');
    const html = fs.readFileSync(templatePath, 'utf-8')
      .replace(/\{\{LOGIN_URL\}\}/g, loginUrl)
      .replace('{{EMAIL}}', email);

    await this.emailService.sendEmail({
      recipients: [email],
      subject: 'Your AUM ERP Login Token',
      html,
    });
  }

  async validateUser(details: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    // Find existing user
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
    });

    // If user does not exist, create a new one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: details.email,
          firstName: details.firstName,
          lastName: details.lastName,
          picture: details.picture,
        },
      });
    } else {
      // If user exists, update their profile picture and name in case it changed
      user = await this.prisma.user.update({
        where: { email: details.email },
        data: {
          firstName: details.firstName,
          lastName: details.lastName,
          picture: details.picture,
        },
      });
    }

    return user;
  }
}
