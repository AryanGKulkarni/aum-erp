import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
})
export class CustomerModule {}
