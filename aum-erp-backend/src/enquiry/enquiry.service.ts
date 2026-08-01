import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto, CreateEnquiryLineDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto, UpdateEnquiryLineDto } from './dto/update-enquiry.dto';
import { EnquiryStatus, Prisma } from '@prisma/client';

const enquiryInclude = {
  customer: true,
  enquiryLines: {
    include: {
      part: true,
      suggestedMachine: true,
      attachments: { orderBy: { uploadedAt: 'desc' } },
    },
    orderBy: { lineNumber: 'asc' },
  },
  feasibilityStudy: true,
} satisfies Prisma.EnquiryInclude;

@Injectable()
export class EnquiryService {
  constructor(private prisma: PrismaService) {}

  private async generateEnquiryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.enquiry.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `ENQ-${year}-${sequence}`;
  }

  private async resolvePartId(
    tx: Prisma.TransactionClient,
    enquiryCustomerId: number,
    line: CreateEnquiryLineDto,
  ): Promise<number> {
    if (line.partId) return line.partId;

    if (!line.part) {
      throw new BadRequestException('Each line requires either partId or part details');
    }

    const newPart = await tx.part.create({
      data: {
        customerId: line.part.customerId ?? enquiryCustomerId,
        partName: line.part.partName,
        partDrawingNumber: line.part.partDrawingNumber,
        materialGrade: line.part.materialGrade,
      },
    });
    return newPart.partId;
  }

  async create(dto: CreateEnquiryDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one enquiry line is required');
    }

    const enquiryNumber = dto.enquiryNumber ?? (await this.generateEnquiryNumber());

    return this.prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.create({
        data: {
          enquiryNumber,
          customerId: dto.customerId,
          enquiryDate: new Date(dto.enquiryDate),
          receivedBy: dto.receivedBy,
          createdBy: dto.createdBy,
          status: dto.status as EnquiryStatus | undefined,
          lostReason: dto.lostReason,
          remarks: dto.remarks,
        },
      });

      for (const [index, line] of dto.lines.entries()) {
        const partId = await this.resolvePartId(tx, dto.customerId, line);

        await tx.enquiryLine.create({
          data: {
            enquiryId: enquiry.enquiryId,
            lineNumber: line.lineNumber ?? index + 1,
            partId,
            supplyType: line.supplyType,
            qtyPerMonth: line.qtyPerMonth,
            suggestedMachineId: line.suggestedMachineId,
            deliveryState: line.deliveryState,
            specialRequirements: line.specialRequirements,
            lineRemarks: line.lineRemarks,
            lineStatus: line.lineStatus,
          },
        });
      }

      return tx.enquiry.findUnique({
        where: { enquiryId: enquiry.enquiryId },
        include: enquiryInclude,
      });
    });
  }

  async findAll() {
    const enquiries = await this.prisma.enquiry.findMany({
      include: {
        customer: true,
        receivedByUser: true,
        enquiryLines: true,
        quotations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enquiries.map((e) => {
      const latestQuotation = e.quotations[0] ?? null;
      const quotation =
        latestQuotation && latestQuotation.updatedAt > e.updatedAt ? 'Generated' : 'Generate';

      return {
        enquiryId: e.enquiryId,
        enquiryNumber: e.enquiryNumber,
        customer: e.customer.companyName,
        enquiryDate: e.enquiryDate,
        receivedBy: e.receivedByUser?.fullName ?? null,
        status: e.status,
        parts: e.enquiryLines.length,
        quotation,
      };
    });
  }

  async findOne(id: number) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { enquiryId: id },
      include: {
        ...enquiryInclude,
        timelines: true,
      },
    });
    if (!enquiry) throw new NotFoundException(`Enquiry #${id} not found`);
    return enquiry;
  }

  async findLine(lineId: number) {
    const line = await this.prisma.enquiryLine.findUnique({ where: { lineId } });
    if (!line) throw new NotFoundException(`Enquiry line #${lineId} not found`);
    return line;
  }

  private async syncLines(
    tx: Prisma.TransactionClient,
    enquiryId: number,
    customerId: number,
    lines: UpdateEnquiryLineDto[],
  ) {
    const existing = await tx.enquiryLine.findMany({ where: { enquiryId } });
    const keepLineIds = new Set(lines.filter((l) => l.lineId).map((l) => l.lineId));

    const toRemove = existing.filter((l) => !keepLineIds.has(l.lineId));
    if (toRemove.length) {
      await tx.enquiryLine.deleteMany({
        where: { lineId: { in: toRemove.map((l) => l.lineId) } },
      });
    }

    for (const [index, line] of lines.entries()) {
      const lineNumber = line.lineNumber ?? index + 1;

      if (line.lineId) {
        await tx.enquiryLine.update({
          where: { lineId: line.lineId },
          data: {
            lineNumber,
            partId: line.partId,
            supplyType: line.supplyType,
            qtyPerMonth: line.qtyPerMonth,
            suggestedMachineId: line.suggestedMachineId,
            deliveryState: line.deliveryState,
            specialRequirements: line.specialRequirements,
            lineRemarks: line.lineRemarks,
            lineStatus: line.lineStatus,
          },
        });
      } else {
        if (!line.supplyType) {
          throw new BadRequestException('supplyType is required for a new enquiry line');
        }
        const partId = await this.resolvePartId(tx, customerId, line as CreateEnquiryLineDto);
        await tx.enquiryLine.create({
          data: {
            enquiryId,
            lineNumber,
            partId,
            supplyType: line.supplyType,
            qtyPerMonth: line.qtyPerMonth,
            suggestedMachineId: line.suggestedMachineId,
            deliveryState: line.deliveryState,
            specialRequirements: line.specialRequirements,
            lineRemarks: line.lineRemarks,
            lineStatus: line.lineStatus,
          },
        });
      }
    }
  }

  async update(id: number, dto: UpdateEnquiryDto) {
    const current = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.enquiry.update({
        where: { enquiryId: id },
        data: {
          customerId: dto.customerId,
          enquiryDate: dto.enquiryDate ? new Date(dto.enquiryDate) : undefined,
          receivedBy: dto.receivedBy,
          createdBy: dto.createdBy,
          status: dto.status as EnquiryStatus | undefined,
          lostReason: dto.lostReason,
          remarks: dto.remarks,
        },
      });

      if (dto.lines) {
        await this.syncLines(tx, id, dto.customerId ?? current.customerId, dto.lines);
      }

      return tx.enquiry.findUnique({
        where: { enquiryId: id },
        include: enquiryInclude,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.enquiry.delete({ where: { enquiryId: id } });
  }
}
