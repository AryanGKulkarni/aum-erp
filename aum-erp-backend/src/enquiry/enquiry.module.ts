import { Module } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { EnquiryController } from './enquiry.controller';
import { PartAttachmentService } from '../part-attachment/part-attachment.service';

@Module({
  controllers: [EnquiryController],
  providers: [EnquiryService, PartAttachmentService],
})
export class EnquiryModule {}
