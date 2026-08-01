import { Module } from '@nestjs/common';
import { FeasibilityStudyService } from './feasibility-study.service';
import { FeasibilityStudyController } from './feasibility-study.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeasibilityStudyController],
  providers: [FeasibilityStudyService],
})
export class FeasibilityStudyModule {}
