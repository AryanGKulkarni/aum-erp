import { Module } from '@nestjs/common';
import { FeasibilityStudyService } from './feasibility-study.service';
import { FeasibilityStudyController } from './feasibility-study.controller';
import { PartAttachmentService } from '../part-attachment/part-attachment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeasibilityStudyController],
  providers: [FeasibilityStudyService, PartAttachmentService],
})
export class FeasibilityStudyModule {}
