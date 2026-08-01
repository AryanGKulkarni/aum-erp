import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import * as mime from 'mime-types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EnquiryService } from './enquiry.service';
import { PartAttachmentService } from '../part-attachment/part-attachment.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';

@Controller('enquiry')
export class EnquiryController {
  constructor(
    private readonly enquiryService: EnquiryService,
    private readonly partAttachmentService: PartAttachmentService,
  ) {}

  @Post()
  create(@Body() createEnquiryDto: CreateEnquiryDto) {
    return this.enquiryService.create(createEnquiryDto);
  }

  @Get()
  findAll() {
    return this.enquiryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enquiryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnquiryDto: UpdateEnquiryDto) {
    return this.enquiryService.update(+id, updateEnquiryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enquiryService.remove(+id);
  }

  @Get('lines/:lineId/attachments')
  getLineAttachments(@Param('lineId', ParseIntPipe) lineId: number) {
    return this.partAttachmentService.findByEnquiryLine(lineId);
  }

  @Post('lines/:lineId/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uploadedBy: { type: 'number' },
        remarks: { type: 'string' },
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
  async addLineAttachments(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body('uploadedBy') uploadedBy: string | undefined,
    @Body('remarks') remarks: string | undefined,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const line = await this.enquiryService.findLine(lineId);

    await Promise.all(
      files.map((file) =>
        this.partAttachmentService.create(line.partId, file, {
          enquiryLineId: lineId,
          uploadedBy: uploadedBy ? parseInt(uploadedBy, 10) : undefined,
          remarks,
        }),
      ),
    );

    return this.partAttachmentService.findByEnquiryLine(lineId);
  }

  @Get('attachments/:attachmentId/view')
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

  @Delete('attachments/:attachmentId')
  removeAttachment(@Param('attachmentId', ParseIntPipe) attachmentId: number) {
    return this.partAttachmentService.remove(attachmentId);
  }
}
