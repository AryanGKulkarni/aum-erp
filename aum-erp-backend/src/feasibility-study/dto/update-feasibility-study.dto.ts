import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateFeasibilityLineDto, CreateFeasibilityStudyDto } from './create-feasibility-study.dto';

export class UpdateFeasibilityLineDto extends PartialType(CreateFeasibilityLineDto) {
  // Present = update this existing line, absent = create a new line
  @ApiPropertyOptional() feasibilityLineId?: number;
}

export class UpdateFeasibilityStudyDto extends PartialType(
  OmitType(CreateFeasibilityStudyDto, ['lines'] as const),
) {
  @ApiPropertyOptional({ type: [UpdateFeasibilityLineDto] })
  lines?: UpdateFeasibilityLineDto[];
}
