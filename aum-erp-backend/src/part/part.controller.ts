import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('part')
export class PartController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.prisma.part.findMany({
      where: customerId ? { customerId: parseInt(customerId, 10) } : undefined,
      select: {
        partId: true,
        partName: true,
        partDrawingNumber: true,
        materialGrade: true,
        partStatus: true,
        customerId: true,
      },
      orderBy: { partName: 'asc' },
    });
  }
}
