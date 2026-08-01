import { Module } from '@nestjs/common';
import { MachineController } from './machine.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MachineController],
})
export class MachineModule {}
