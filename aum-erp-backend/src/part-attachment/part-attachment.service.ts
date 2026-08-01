import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateAttachmentOptions {
  enquiryLineId?: number;
  uploadedBy?: number;
  remarks?: string;
}

@Injectable()
export class PartAttachmentService {
  constructor(private prisma: PrismaService) {}

  async create(partId: number, file: Express.Multer.File, opts: CreateAttachmentOptions = {}) {
    const part = await this.prisma.part.findUnique({ where: { partId } });
    if (!part) throw new NotFoundException(`Part #${partId} not found`);

    const fileType = path.extname(file.originalname).replace('.', '').toLowerCase() || null;

    return this.prisma.partAttachment.create({
      data: {
        partId,
        enquiryLineId: opts.enquiryLineId,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        fileType,
        fileSizeKb: Math.round(file.size / 1024),
        uploadedBy: opts.uploadedBy,
        remarks: opts.remarks,
      },
    });
  }

  async findByPart(partId: number) {
    const part = await this.prisma.part.findUnique({ where: { partId } });
    if (!part) throw new NotFoundException(`Part #${partId} not found`);

    return this.prisma.partAttachment.findMany({
      where: { partId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findByEnquiryLine(enquiryLineId: number) {
    const line = await this.prisma.enquiryLine.findUnique({ where: { lineId: enquiryLineId } });
    if (!line) throw new NotFoundException(`Enquiry line #${enquiryLineId} not found`);

    return this.prisma.partAttachment.findMany({
      where: { enquiryLineId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getFileStream(attachmentId: number) {
    const attachment = await this.prisma.partAttachment.findUnique({
      where: { attachmentId },
    });
    if (!attachment) throw new NotFoundException(`Attachment #${attachmentId} not found`);

    const absolutePath = path.resolve(attachment.filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return { stream: fs.createReadStream(absolutePath), fileName: attachment.fileName };
  }

  async remove(attachmentId: number) {
    const attachment = await this.prisma.partAttachment.findUnique({
      where: { attachmentId },
    });
    if (!attachment) throw new NotFoundException(`Attachment #${attachmentId} not found`);

    const absolutePath = path.resolve(attachment.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return this.prisma.partAttachment.delete({ where: { attachmentId } });
  }
}
