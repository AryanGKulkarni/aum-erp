import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('user')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { userId: true, fullName: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  }
}
