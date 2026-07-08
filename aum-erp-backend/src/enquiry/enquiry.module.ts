import { Module } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { EnquiryController } from './enquiry.controller';

@Module({
  controllers: [EnquiryController],
  providers: [EnquiryService],
})
export class EnquiryModule {}
