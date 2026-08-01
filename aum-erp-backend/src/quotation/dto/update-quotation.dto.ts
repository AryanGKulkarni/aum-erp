import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuotationDto {
  @ApiPropertyOptional() paymentTerms?: string;
  @ApiPropertyOptional() deliveryTerms?: string;
  @ApiPropertyOptional() validUntil?: string;
  @ApiPropertyOptional({ enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Revised', 'Expired'] })
  quotationStatus?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Revised' | 'Expired';
  @ApiPropertyOptional() sentOn?: string;
  @ApiPropertyOptional() acceptedOn?: string;
  @ApiPropertyOptional() rejectedOn?: string;
  @ApiPropertyOptional() customerFeedback?: string;
}
