import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

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

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    if (!dto.companyName?.trim()) {
      throw new BadRequestException('companyName is required');
    }

    return this.prisma.customer.create({
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        gstNumber: dto.gstNumber,
      },
    });
  }
}
