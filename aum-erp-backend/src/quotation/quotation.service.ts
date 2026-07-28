import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationStatus } from '@prisma/client';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationService {
  constructor(private prisma: PrismaService) {}

  private async generateQuotationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.quotation.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `QUO-${year}-${sequence}`;
  }

  async generateForEnquiry(enquiryId: number) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { enquiryId },
      include: {
        enquiryLines: {
          include: {
            part: { include: { toolingDetails: true } },
            feasibilityStudy: { include: { costEstimations: true } },
          },
        },
      },
    });

    if (!enquiry) throw new NotFoundException(`Enquiry #${enquiryId} not found`);

    // Sum quotedPricePerPc * qtyPerYear across all lines that have cost data
    let totalQuotedValue = 0;
    for (const line of enquiry.enquiryLines) {
      const cost = line.feasibilityStudy?.costEstimations?.[0];
      if (cost?.quotedPricePerPc && line.qtyPerYear) {
        totalQuotedValue += Number(cost.quotedPricePerPc) * line.qtyPerYear;
      }
    }

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);

    // If a quotation already exists for this enquiry, update it instead of creating a duplicate
    const existing = await this.prisma.quotation.findFirst({
      where: { enquiryId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.prisma.quotation.update({
        where: { quotationId: existing.quotationId },
        data: {
          totalQuotedValue,
          quotationDate: today,
          validUntil,
          preparedBy: enquiry.receivedBy,
          quotationStatus: QuotationStatus.Draft,
        },
        include: {
          enquiry: { include: { customer: true } },
        },
      });
    }

    const quotationNumber = await this.generateQuotationNumber();

    return this.prisma.quotation.create({
      data: {
        enquiryId,
        quotationNumber,
        quotationDate: today,
        validUntil,
        preparedBy: enquiry.receivedBy,
        totalQuotedValue,
        quotationStatus: QuotationStatus.Draft,
      },
      include: {
        enquiry: { include: { customer: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.quotation.findMany({
      include: { enquiry: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { quotationId: id },
      include: {
        enquiry: {
          include: {
            customer: true,
            enquiryLines: {
              include: {
                part: { include: { toolingDetails: true } },
                feasibilityStudy: { include: { costEstimations: true } },
              },
            },
          },
        },
      },
    });
    if (!quotation) throw new NotFoundException(`Quotation #${id} not found`);
    return quotation;
  }

  async update(id: number, dto: UpdateQuotationDto) {
    await this.findOne(id);
    return this.prisma.quotation.update({
      where: { quotationId: id },
      data: {
        paymentTerms: dto.paymentTerms,
        deliveryTerms: dto.deliveryTerms,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        quotationStatus: dto.quotationStatus as QuotationStatus | undefined,
        sentOn: dto.sentOn ? new Date(dto.sentOn) : undefined,
        customerFeedback: dto.customerFeedback,
      },
      include: {
        enquiry: {
          include: {
            customer: true,
            enquiryLines: {
              include: {
                part: { include: { toolingDetails: true } },
                feasibilityStudy: { include: { costEstimations: true } },
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.quotation.delete({ where: { quotationId: id } });
  }
}
