import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartDto {
  @ApiPropertyOptional() customerId?: number;
  @ApiProperty() partName!: string;
  @ApiPropertyOptional() partDrawingNumber?: string;
  @ApiPropertyOptional() materialGrade?: string;
  @ApiPropertyOptional() forgingWeightKg?: number;
  @ApiPropertyOptional() finishWeightKg?: number;
  @ApiPropertyOptional() billetDiameterMm?: number;
  @ApiPropertyOptional() billetLengthMm?: number;
  @ApiPropertyOptional() noOfOperations?: number;
}

export class CreateCostEstimationDto {
  @ApiPropertyOptional() rmRatePerKg?: number;
  @ApiPropertyOptional() rmCostPerPc?: number;
  @ApiPropertyOptional() dieCostPerPc?: number;
  @ApiPropertyOptional() machineCostPerPc?: number;
  @ApiPropertyOptional() labourCostPerPc?: number;
  @ApiPropertyOptional() overheadPct?: number;
  @ApiPropertyOptional() overheadPerPc?: number;
  @ApiPropertyOptional() totalCostPerPc?: number;
  @ApiPropertyOptional() marginPct?: number;
  @ApiPropertyOptional() quotedPricePerPc?: number;
}

export class CreateFeasibilityStudyDto {
  // Provide either partId (existing part) or part (new part details)
  @ApiPropertyOptional() partId?: number;
  @ApiPropertyOptional({ type: CreatePartDto }) part?: CreatePartDto;

  @ApiPropertyOptional() assessedBy?: string;
  @ApiPropertyOptional() assessmentDate?: string;

  @ApiPropertyOptional({ enum: ['Press_1000T', 'Belt_Hammer_075T'] })
  recommendedMachine?: 'Press_1000T' | 'Belt_Hammer_075T';

  @ApiPropertyOptional() billetWeightEstKg?: number;
  @ApiPropertyOptional() flashAllowancePct?: number;
  @ApiPropertyOptional() materialUtilisationPct?: number;
  @ApiPropertyOptional() cycleTimeMin?: number;
  @ApiPropertyOptional() machineLoadHrsMonth?: number;
  @ApiPropertyOptional() availableCapacityHrs?: number;
  @ApiPropertyOptional() capacityFeasible?: boolean;
  @ApiPropertyOptional() flagsRisks?: string;

  @ApiPropertyOptional({ enum: ['Feasible', 'Not_Feasible', 'Conditional'] })
  overallVerdict?: 'Feasible' | 'Not_Feasible' | 'Conditional';

  @ApiPropertyOptional() verdictRemarks?: string;

  @ApiPropertyOptional({ type: CreateCostEstimationDto })
  costEstimation?: CreateCostEstimationDto;
}
