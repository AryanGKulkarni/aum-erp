import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PartAttachmentService {
  constructor(private prisma: PrismaService) {}

  async create(
    partId: number,
    file: Express.Multer.File,
    uploadedBy?: string,
    remarks?: string,
  ) {
    const part = await this.prisma.part.findUnique({ where: { partId } });
    if (!part) throw new NotFoundException(`Part #${partId} not found`);

    return this.prisma.partAttachment.create({
      data: {
        partId,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        uploadedBy,
        remarks,
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
