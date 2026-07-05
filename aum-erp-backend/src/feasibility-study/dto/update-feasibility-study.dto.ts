import { PartialType } from '@nestjs/swagger';
import { CreateFeasibilityStudyDto } from './create-feasibility-study.dto';

export class UpdateFeasibilityStudyDto extends PartialType(CreateFeasibilityStudyDto) {}
