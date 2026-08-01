import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('process')
export class ProcessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.process.findMany({
      where: { isActive: true },
      select: { processId: true, processCode: true, processName: true, displayOrder: true },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
