import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('machine')
export class MachineController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.machine.findMany({
      select: { machineId: true, machineName: true, machineType: true, status: true },
      orderBy: { machineName: 'asc' },
    });
  }
}
