import { Controller, Get, Post, Patch, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Controller('quotation')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post('generate/:studyId')
  generate(@Param('studyId', ParseIntPipe) studyId: number) {
    return this.quotationService.generateFromStudy(studyId);
  }

  @Get()
  findAll() {
    return this.quotationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuotationDto) {
    return this.quotationService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.remove(id);
  }
}
