import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateEnquiryDto, CreateEnquiryLineDto } from './create-enquiry.dto';

export class UpdateEnquiryLineDto extends PartialType(CreateEnquiryLineDto) {
  // Present = update this existing line, absent = create a new line
  @ApiPropertyOptional() lineId?: number;
}

export class UpdateEnquiryDto extends PartialType(OmitType(CreateEnquiryDto, ['lines'] as const)) {
  @ApiPropertyOptional({ type: [UpdateEnquiryLineDto] })
  lines?: UpdateEnquiryLineDto[];
}
