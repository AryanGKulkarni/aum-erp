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

  // Weights and billet dimensions belong to costEstimation, not to the line.
  @ApiProperty() recommendedMachineId!: number;
  @ApiPropertyOptional() billetWeightEstKg?: number;
  @ApiPropertyOptional() flashAllowancePct?: number;
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
