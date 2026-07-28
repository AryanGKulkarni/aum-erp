import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuotationDto {
  @ApiPropertyOptional() paymentTerms?: string;
  @ApiPropertyOptional() deliveryTerms?: string;
  @ApiPropertyOptional() validUntil?: string;
  @ApiPropertyOptional({ enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Revised'] })
  quotationStatus?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Revised';
  @ApiPropertyOptional() sentOn?: string;
  @ApiPropertyOptional() customerFeedback?: string;
}
