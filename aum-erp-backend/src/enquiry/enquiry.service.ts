import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { EnquiryStatus } from '@prisma/client';

@Injectable()
export class EnquiryService {
  constructor(private prisma: PrismaService) {}

  private async generateEnquiryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.enquiry.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `ENQ-${year}-${sequence}`;
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
          status: (dto.status as EnquiryStatus) ?? EnquiryStatus.Open,
          lostReason: dto.lostReason,
          remarks: dto.remarks,
        },
      });

      for (const line of dto.lines) {
        await tx.enquiryLine.create({
          data: {
            enquiryId: enquiry.enquiryId,
            partId: line.partId,
            feasibilityId: line.feasibilityId,
            qtyPerMonth: line.qtyPerMonth,
            qtyPerYear: line.qtyPerYear,
            suggestedMachine: line.suggestedMachine,
            heatTreatmentRequired: line.heatTreatmentRequired ?? false,
            heatTreatmentSpec: line.heatTreatmentSpec,
            specialRequirements: line.specialRequirements,
            lineRemarks: line.lineRemarks,
          },
        });

        for (const td of line.toolingDetails ?? []) {
          await tx.toolingDetail.create({
            data: {
              partId: line.partId,
              dieDrawingAvailable: td.dieDrawingAvailable,
              estimatedDieCost: td.estimatedDieCost,
              dieAmortisationQty: td.dieAmortisationQty,
              dieAmortisationPerPc: td.dieAmortisationPerPc,
              dieRemarks: td.dieRemarks,
            },
          });
        }
      }

      return tx.enquiry.findUnique({
        where: { enquiryId: enquiry.enquiryId },
        include: {
          customer: true,
          enquiryLines: {
            include: {
              part: { include: { toolingDetails: true } },
              feasibilityStudy: true,
            },
          },
        },
      });
    });
  }

  async findAll() {
    const enquiries = await this.prisma.enquiry.findMany({
      include: {
        customer: true,
        enquiryLines: {
          include: {
            part: { include: { toolingDetails: true } },
          },
        },
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
        latestQuotation && latestQuotation.updatedAt > e.updatedAt
          ? 'Generated'
          : 'Generate';

      const dieSets = e.enquiryLines.reduce(
        (acc, line) => acc + line.part.toolingDetails.length,
        0,
      );

      return {
        enquiryId: e.enquiryId,
        enquiryNumber: e.enquiryNumber,
        customer: e.customer.companyName,
        enquiryDate: e.enquiryDate,
        receivedBy: e.receivedBy,
        status: e.status,
        parts: e.enquiryLines.length,
        dieSets,
        quotation,
      };
    });
  }

  async findOne(id: number) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { enquiryId: id },
      include: {
        customer: true,
        enquiryLines: {
          include: {
            part: { include: { toolingDetails: true } },
            feasibilityStudy: true,
          },
        },
        timelines: true,
      },
    });
    if (!enquiry) throw new NotFoundException(`Enquiry #${id} not found`);
    return enquiry;
  }

  async update(id: number, dto: UpdateEnquiryDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.enquiry.update({
        where: { enquiryId: id },
        data: {
          customerId: dto.customerId,
          enquiryDate: dto.enquiryDate ? new Date(dto.enquiryDate) : undefined,
          receivedBy: dto.receivedBy,
          status: dto.status as EnquiryStatus | undefined,
          lostReason: dto.lostReason,
          remarks: dto.remarks,
        },
      });

      if (dto.lines && dto.lines.length > 0) {
        await tx.enquiryLine.deleteMany({ where: { enquiryId: id } });

        for (const line of dto.lines) {
          await tx.enquiryLine.create({
            data: {
              enquiryId: id,
              partId: line.partId,
              feasibilityId: line.feasibilityId,
              qtyPerMonth: line.qtyPerMonth,
              qtyPerYear: line.qtyPerYear,
              suggestedMachine: line.suggestedMachine,
              heatTreatmentRequired: line.heatTreatmentRequired ?? false,
              heatTreatmentSpec: line.heatTreatmentSpec,
              specialRequirements: line.specialRequirements,
              lineRemarks: line.lineRemarks,
            },
          });

          if (line.toolingDetails?.length) {
            await tx.toolingDetail.deleteMany({ where: { partId: line.partId } });
            for (const td of line.toolingDetails) {
              await tx.toolingDetail.create({
                data: {
                  partId: line.partId,
                  dieDrawingAvailable: td.dieDrawingAvailable,
                  estimatedDieCost: td.estimatedDieCost,
                  dieAmortisationQty: td.dieAmortisationQty,
                  dieAmortisationPerPc: td.dieAmortisationPerPc,
                  dieRemarks: td.dieRemarks,
                },
              });
            }
          }
        }
      }

      return tx.enquiry.findUnique({
        where: { enquiryId: id },
        include: {
          customer: true,
          enquiryLines: {
            include: {
              part: { include: { toolingDetails: true } },
              feasibilityStudy: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.enquiry.delete({ where: { enquiryId: id } });
  }
}
