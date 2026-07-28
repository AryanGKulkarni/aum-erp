import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  Res,
  StreamableFile,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import * as mime from 'mime-types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FeasibilityStudyService } from './feasibility-study.service';
import { PartAttachmentService } from '../part-attachment/part-attachment.service';
import { CreateFeasibilityStudyDto } from './dto/create-feasibility-study.dto';
import { UpdateFeasibilityStudyDto } from './dto/update-feasibility-study.dto';

@Controller('feasibility-study')
export class FeasibilityStudyController {
  constructor(
    private readonly feasibilityStudyService: FeasibilityStudyService,
    private readonly partAttachmentService: PartAttachmentService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'JSON stringified CreateFeasibilityStudyDto',
        },
        uploadedBy: { type: 'string' },
        attachments: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('attachments', 20, {
      storage: diskStorage({
        destination: './uploads/attachments',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body('data') dataStr: string,
    @Body('uploadedBy') uploadedBy: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateFeasibilityStudyDto = JSON.parse(dataStr);
    const study = await this.feasibilityStudyService.create(dto);

    if (files?.length) {
      await Promise.all(
        files.map((file) =>
          this.partAttachmentService.create(study!.partId, file, uploadedBy),
        ),
      );
    }

    return this.feasibilityStudyService.findOne(study!.feasibilityId);
  }

  @Get()
  findAll(@Query('partId') partId?: string) {
    return this.feasibilityStudyService.findAll(partId ? parseInt(partId, 10) : undefined);
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

  @Get(':id/attachments')
  async getAttachments(@Param('id', ParseIntPipe) id: number) {
    const study = await this.feasibilityStudyService.findOne(id);
    return this.partAttachmentService.findByPart(study.partId);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('attachments', 20, {
      storage: diskStorage({
        destination: './uploads/attachments',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Body('uploadedBy') uploadedBy: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const study = await this.feasibilityStudyService.findOne(id);
    await Promise.all(
      files.map((file) =>
        this.partAttachmentService.create(study!.partId, file, uploadedBy),
      ),
    );
    return this.partAttachmentService.findByPart(study!.partId);
  }

  @Get(':id/attachments/:attachmentId/view')
  async viewAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, fileName } = await this.partAttachmentService.getFileStream(attachmentId);
    const contentType = mime.lookup(fileName) || 'application/octet-stream';
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(@Param('attachmentId', ParseIntPipe) attachmentId: number) {
    return this.partAttachmentService.remove(attachmentId);
  }
}
