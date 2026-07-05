import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeasibilityStudyService } from './feasibility-study.service';
import { CreateFeasibilityStudyDto } from './dto/create-feasibility-study.dto';
import { UpdateFeasibilityStudyDto } from './dto/update-feasibility-study.dto';

@Controller('feasibility-study')
export class FeasibilityStudyController {
  constructor(private readonly feasibilityStudyService: FeasibilityStudyService) {}

  @Post()
  create(@Body() createFeasibilityStudyDto: CreateFeasibilityStudyDto) {
    return this.feasibilityStudyService.create(createFeasibilityStudyDto);
  }

  @Get()
  findAll() {
    return this.feasibilityStudyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feasibilityStudyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeasibilityStudyDto: UpdateFeasibilityStudyDto) {
    return this.feasibilityStudyService.update(+id, updateFeasibilityStudyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feasibilityStudyService.remove(+id);
  }
}
