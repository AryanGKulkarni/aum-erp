import { Module } from '@nestjs/common';
import { PartController } from './part.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartController],
})
export class PartModule {}
