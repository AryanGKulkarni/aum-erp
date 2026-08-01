import { Module } from '@nestjs/common';
import { ProcessController } from './process.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProcessController],
})
export class ProcessModule {}
