import { Injectable } from '@nestjs/common';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';

@Injectable()
export class EnquiryService {
  create(createEnquiryDto: CreateEnquiryDto) {
    return 'This action adds a new enquiry';
  }

  findAll() {
    return `This action returns all enquiry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} enquiry`;
  }

  update(id: number, updateEnquiryDto: UpdateEnquiryDto) {
    return `This action updates a #${id} enquiry`;
  }

  remove(id: number) {
    return `This action removes a #${id} enquiry`;
  }
}
