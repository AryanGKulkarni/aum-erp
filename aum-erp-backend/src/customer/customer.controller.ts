import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.customer.findMany({
      orderBy: { companyName: 'asc' },
    });
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    if (!dto.companyName?.trim()) {
      throw new BadRequestException('companyName is required');
    }

    try {
      return await this.prisma.customer.create({
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
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A customer with this GST number already exists');
      }
      throw err;
    }
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    if (dto.companyName !== undefined && !dto.companyName.trim()) {
      throw new BadRequestException('companyName cannot be empty');
    }

    try {
      return await this.prisma.customer.update({
        where: { customerId: id },
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
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A customer with this GST number already exists');
      }
      if (err?.code === 'P2025') {
        throw new NotFoundException(`Customer #${id} not found`);
      }
      throw err;
    }
  }
}
