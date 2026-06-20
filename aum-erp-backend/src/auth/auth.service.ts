import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
