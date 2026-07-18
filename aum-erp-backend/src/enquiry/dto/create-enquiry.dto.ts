import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateToolingDetailDto {
  @ApiPropertyOptional({ enum: ['Customer_Provides', 'To_Be_Developed', 'Existing_Die'] })
  dieDrawingAvailable?: 'Customer_Provides' | 'To_Be_Developed' | 'Existing_Die';

  @ApiPropertyOptional() estimatedDieCost?: number;
  @ApiPropertyOptional() dieAmortisationQty?: number;
  @ApiPropertyOptional() dieAmortisationPerPc?: number;
  @ApiPropertyOptional() dieRemarks?: string;
}

export class CreateEnquiryLineDto {
  @ApiProperty() partId!: number;

  @ApiPropertyOptional() feasibilityId?: number;
  @ApiPropertyOptional() qtyPerMonth?: number;
  @ApiPropertyOptional() qtyPerYear?: number;

  @ApiPropertyOptional({ enum: ['Press_1000T', 'Belt_Hammer_075T', 'TBD'] })
  suggestedMachine?: 'Press_1000T' | 'Belt_Hammer_075T' | 'TBD';

  @ApiPropertyOptional() heatTreatmentRequired?: boolean;
  @ApiPropertyOptional() heatTreatmentSpec?: string;
  @ApiPropertyOptional() specialRequirements?: string;
  @ApiPropertyOptional() lineRemarks?: string;

  @ApiPropertyOptional({ type: CreateToolingDetailDto })
  toolingDetail?: CreateToolingDetailDto;
}

export class CreateEnquiryDto {
  // Auto-generated as ENQ-YYYY-XXXX if omitted
  @ApiPropertyOptional() enquiryNumber?: string;

  @ApiProperty() customerId!: number;
  @ApiProperty() enquiryDate!: string;

  @ApiPropertyOptional() receivedBy?: string;

  @ApiPropertyOptional({ enum: ['Open', 'Feasibility', 'Quoted', 'Won', 'Lost', 'On_Hold'] })
  status?: 'Open' | 'Feasibility' | 'Quoted' | 'Won' | 'Lost' | 'On_Hold';

  @ApiPropertyOptional() lostReason?: string;
  @ApiPropertyOptional() remarks?: string;

  @ApiProperty({ type: [CreateEnquiryLineDto] })
  lines!: CreateEnquiryLineDto[];
}
