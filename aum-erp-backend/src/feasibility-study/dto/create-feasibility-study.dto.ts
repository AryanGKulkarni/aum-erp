import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateToolingSetDto {
  // Auto-assigned from the set's position in the array if omitted
  @ApiPropertyOptional() setNumber?: number;

  @ApiPropertyOptional({ enum: ['Customer_Provides', 'To_Be_Developed', 'Existing_Die'] })
  dieDrawingStatus?: 'Customer_Provides' | 'To_Be_Developed' | 'Existing_Die';

  @ApiPropertyOptional() estimatedDieCost?: number;
  @ApiPropertyOptional() dieAmortisationQty?: number;
  @ApiPropertyOptional() dieAmortisationPerPc?: number;
  @ApiPropertyOptional() dieRemarks?: string;
}

export class CreateCostEstimationDto {
  @ApiPropertyOptional() rmDiameterMm?: number;
  @ApiPropertyOptional() forgingYieldPct?: number;
  @ApiPropertyOptional() forgingWeightKg?: number;
  @ApiPropertyOptional() cutPcWeightKg?: number;
  @ApiPropertyOptional() grossWeightKg?: number;

  @ApiPropertyOptional() rmRatePerKg?: number;
  @ApiPropertyOptional() dieFactorPerPc?: number;
  @ApiPropertyOptional() cuttingCostFactorPerCm2?: number;
  @ApiPropertyOptional() forgingConversionPerKg?: number;
  @ApiPropertyOptional() htFactorPerKg?: number;
  @ApiPropertyOptional() visualInspectionPerPc?: number;
  @ApiPropertyOptional() rejectionFactorPct?: number;
  @ApiPropertyOptional() iccFactorPct?: number;
  @ApiPropertyOptional() transportationFactorPct?: number;
  @ApiPropertyOptional() profitOnVaFactorPct?: number;
  @ApiPropertyOptional() scrapFactorPerKg?: number;

  @ApiPropertyOptional() rmCost?: number;
  @ApiPropertyOptional() cuttingCost?: number;
  @ApiPropertyOptional() forgingConversionCost?: number;
  @ApiPropertyOptional() htShotblastCost?: number;
  @ApiPropertyOptional() visualInspectionCost?: number;
  @ApiPropertyOptional() valueAddition?: number;
  @ApiPropertyOptional() subTotal?: number;
  @ApiPropertyOptional() rejectionCost?: number;
  @ApiPropertyOptional() iccCost?: number;
  @ApiPropertyOptional() transportationCost?: number;
  @ApiPropertyOptional() profitOnVa?: number;
  @ApiPropertyOptional() scrapAmount?: number;
  @ApiPropertyOptional() quotedPricePerPc?: number;
}

export class CreateFeasibilityLineDto {
  @ApiProperty() enquiryLineId!: number;

  @ApiPropertyOptional() forgingWeightKg?: number;
  @ApiPropertyOptional() finishWeightKg?: number;
  @ApiPropertyOptional() billetDiameterMm?: number;
  @ApiPropertyOptional() billetLengthMm?: number;

  @ApiProperty() recommendedMachineId!: number;
  @ApiPropertyOptional() billetWeightEstKg?: number;
  @ApiPropertyOptional() flashAllowancePct?: number;
  @ApiPropertyOptional() materialUtilisationPct?: number;
  @ApiPropertyOptional() cycleTimeMin?: number;
  @ApiPropertyOptional() machineLoadHrsMonth?: number;
  @ApiPropertyOptional() availableCapacityHrs?: number;

  @ApiPropertyOptional({ enum: ['Yes', 'Over_Capacity', 'Not_Assessed'] })
  capacityFeasible?: 'Yes' | 'Over_Capacity' | 'Not_Assessed';

  @ApiPropertyOptional() flagsRisks?: string;

  @ApiPropertyOptional({ enum: ['Feasible', 'Not_Feasible', 'Conditional'] })
  overallVerdict?: 'Feasible' | 'Not_Feasible' | 'Conditional';

  @ApiPropertyOptional() verdictRemarks?: string;

  @ApiPropertyOptional({ type: [Number], description: 'process_id[] performed on this line' })
  processIds?: number[];

  @ApiPropertyOptional({ type: [CreateToolingSetDto] })
  toolingSets?: CreateToolingSetDto[];

  @ApiPropertyOptional({ type: CreateCostEstimationDto })
  costEstimation?: CreateCostEstimationDto;
}

export class CreateFeasibilityStudyDto {
  @ApiProperty() enquiryId!: number;

  @ApiPropertyOptional() assessedBy?: number;
  @ApiPropertyOptional() assessmentDate?: string;

  @ApiPropertyOptional({ enum: ['Draft', 'Submitted_for_Review', 'Reviewed', 'Quoted'] })
  studyStatus?: 'Draft' | 'Submitted_for_Review' | 'Reviewed' | 'Quoted';

  @ApiPropertyOptional() reviewedBy?: number;
  @ApiPropertyOptional() reviewedAt?: string;

  @ApiPropertyOptional({ type: [CreateFeasibilityLineDto] })
  lines?: CreateFeasibilityLineDto[];
}
