import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OverallVerdict, Prisma, QuotationStatus } from '@prisma/client';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

const quotationInclude = {
  customer: true,
  enquiry: true,
  study: true,
  preparedByUser: true,
  quotationLines: { orderBy: { lineNumber: 'asc' } },
} satisfies Prisma.QuotationInclude;

@Injectable()
export class QuotationService {
  constructor(private prisma: PrismaService) {}

  private async generateQuotationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.quotation.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `QUO-${year}-${sequence}`;
  }

  async generateFromStudy(studyId: number) {
    const study = await this.prisma.feasibilityStudy.findUnique({
      where: { studyId },
      include: {
        enquiry: true,
        feasibilityLines: {
          where: { overallVerdict: OverallVerdict.Feasible },
          include: {
            enquiryLine: { include: { part: true } },
            costEstimation: true,
            toolingSets: true,
            processes: { include: { process: true } },
          },
          orderBy: { enquiryLine: { lineNumber: 'asc' } },
        },
      },
    });
    if (!study) throw new NotFoundException(`Feasibility study #${studyId} not found`);

    if (!study.feasibilityLines.length) {
      throw new BadRequestException(
        'This study has no lines with an overall verdict of Feasible — nothing to quote',
      );
    }

    const previous = await this.prisma.quotation.findFirst({
      where: { studyId },
      orderBy: { revisionNo: 'desc' },
    });
    const quotationNumber = previous?.quotationNumber ?? (await this.generateQuotationNumber());
    const revisionNo = (previous?.revisionNo ?? 0) + 1;

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);

    return this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          studyId,
          enquiryId: study.enquiryId,
          customerId: study.enquiry.customerId,
          revisionNo,
          quotationDate: today,
          validUntil,
          preparedBy: study.assessedBy,
          quotationStatus: QuotationStatus.Draft,
        },
      });

      let totalMonthlyValue = 0;

      for (const [index, line] of study.feasibilityLines.entries()) {
        const cost = line.costEstimation;
        const qtyPerMonth = line.enquiryLine.qtyPerMonth ?? null;
        const costPerPc = cost?.quotedPricePerPc ?? null;
        const monthlyValue =
          costPerPc !== null && qtyPerMonth !== null ? Number(costPerPc) * qtyPerMonth : null;
        const developmentCost = line.toolingSets.length
          ? line.toolingSets.reduce((sum, ts) => sum + Number(ts.estimatedDieCost ?? 0), 0)
          : null;
        const processesText =
          line.processes.map((p) => p.process.processName).join(', ') || null;

        if (monthlyValue !== null) totalMonthlyValue += monthlyValue;

        await tx.quotationLine.create({
          data: {
            quotationId: quotation.quotationId,
            lineNumber: index + 1,
            feasibilityLineId: line.feasibilityLineId,
            partName: line.enquiryLine.part.partName,
            partDrawingNumber: line.enquiryLine.part.partDrawingNumber,
            materialGrade: line.enquiryLine.part.materialGrade,
            processesText,
            rmDiameterMm: cost?.rmDiameterMm,
            forgingYieldPct: cost?.forgingYieldPct,
            forgingWeightKg: cost?.forgingWeightKg,
            cutPcWeightKg: cost?.cutPcWeightKg,
            grossWeightKg: cost?.grossWeightKg,
            rmRatePerKg: cost?.rmRatePerKg,
            dieFactorPerPc: cost?.dieFactorPerPc,
            cuttingCostFactorPerCm2: cost?.cuttingCostFactorPerCm2,
            forgingConversionPerKg: cost?.forgingConversionPerKg,
            htFactorPerKg: cost?.htFactorPerKg,
            visualInspectionPerPc: cost?.visualInspectionPerPc,
            rejectionFactorPct: cost?.rejectionFactorPct,
            iccFactorPct: cost?.iccFactorPct,
            transportationFactorPct: cost?.transportationFactorPct,
            profitOnVaFactorPct: cost?.profitOnVaFactorPct,
            scrapFactorPerKg: cost?.scrapFactorPerKg,
            rmCost: cost?.rmCost,
            cuttingCost: cost?.cuttingCost,
            forgingConversionCost: cost?.forgingConversionCost,
            htShotblastCost: cost?.htShotblastCost,
            visualInspectionCost: cost?.visualInspectionCost,
            valueAddition: cost?.valueAddition,
            subTotal: cost?.subTotal,
            rejectionCost: cost?.rejectionCost,
            iccCost: cost?.iccCost,
            transportationCost: cost?.transportationCost,
            profitOnVa: cost?.profitOnVa,
            scrapAmount: cost?.scrapAmount,
            costPerPc,
            qtyPerMonth,
            monthlyValue,
            developmentCost,
          },
        });
      }

      return tx.quotation.update({
        where: { quotationId: quotation.quotationId },
        data: {
          totalMonthlyValue,
          annualEstimate: totalMonthlyValue * 12,
        },
        include: quotationInclude,
      });
    });
  }

  async findAll() {
    return this.prisma.quotation.findMany({
      include: {
        customer: true,
        enquiry: true,
        _count: { select: { quotationLines: true } },
      },
      orderBy: [{ quotationNumber: 'desc' }, { revisionNo: 'desc' }],
    });
  }

  async findOne(id: number) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { quotationId: id },
      include: quotationInclude,
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
        acceptedOn: dto.acceptedOn ? new Date(dto.acceptedOn) : undefined,
        rejectedOn: dto.rejectedOn ? new Date(dto.rejectedOn) : undefined,
        customerFeedback: dto.customerFeedback,
      },
      include: quotationInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.quotation.delete({ where: { quotationId: id } });
  }
}
