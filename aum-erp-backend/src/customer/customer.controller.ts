import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.customer.findMany({
      select: { customerId: true, companyName: true, contactPerson: true },
      orderBy: { companyName: 'asc' },
    });
  }
}
