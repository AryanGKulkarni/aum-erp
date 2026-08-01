import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnquiryLinePartDto {
  // Defaults to the enquiry's customerId if omitted
  @ApiPropertyOptional() customerId?: number;
  @ApiProperty() partName!: string;
  @ApiPropertyOptional() partDrawingNumber?: string;
  @ApiPropertyOptional() materialGrade?: string;
}

export class CreateEnquiryLineDto {
  // Auto-assigned from the line's position in the array if omitted
  @ApiPropertyOptional() lineNumber?: number;

  // Provide either partId (existing part) or part (new part details)
  @ApiPropertyOptional() partId?: number;
  @ApiPropertyOptional({ type: CreateEnquiryLinePartDto }) part?: CreateEnquiryLinePartDto;

  @ApiProperty({ enum: ['With_Material', 'Labour'] })
  supplyType!: 'With_Material' | 'Labour';

  @ApiPropertyOptional() qtyPerMonth?: number;

  @ApiPropertyOptional() suggestedMachineId?: number;

  @ApiPropertyOptional({ enum: ['As_Forged', 'Machined'] })
  deliveryState?: 'As_Forged' | 'Machined';

  @ApiPropertyOptional() specialRequirements?: string;
  @ApiPropertyOptional() lineRemarks?: string;

  @ApiPropertyOptional({ enum: ['Pending_Feasibility', 'Assessed', 'Quoted', 'Dropped'] })
  lineStatus?: 'Pending_Feasibility' | 'Assessed' | 'Quoted' | 'Dropped';
}

export class CreateEnquiryDto {
  // Auto-generated as ENQ-YYYY-XXXX if omitted
  @ApiPropertyOptional() enquiryNumber?: string;

  @ApiProperty() customerId!: number;
  @ApiProperty() enquiryDate!: string;

  @ApiPropertyOptional() receivedBy?: number;
  @ApiPropertyOptional() createdBy?: number;

  @ApiPropertyOptional({
    enum: ['Draft', 'Open', 'Under_Feasibility', 'Quoted', 'Won', 'Lost', 'On_Hold'],
  })
  status?: 'Draft' | 'Open' | 'Under_Feasibility' | 'Quoted' | 'Won' | 'Lost' | 'On_Hold';

  @ApiPropertyOptional() lostReason?: string;
  @ApiPropertyOptional() remarks?: string;

  @ApiProperty({ type: [CreateEnquiryLineDto] })
  lines!: CreateEnquiryLineDto[];
}
