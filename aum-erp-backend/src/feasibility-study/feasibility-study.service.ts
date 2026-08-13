import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFeasibilityLineDto,
  CreateFeasibilityStudyDto,
} from './dto/create-feasibility-study.dto';
import {
  UpdateFeasibilityLineDto,
  UpdateFeasibilityStudyDto,
} from './dto/update-feasibility-study.dto';
import { FeasibilityStudyStatus, Prisma } from '@prisma/client';

const studyInclude = {
  enquiry: { include: { customer: true } },
  assessedByUser: true,
  reviewedByUser: true,
  feasibilityLines: {
    include: {
      enquiryLine: { include: { part: true } },
      recommendedMachine: true,
      processes: { include: { process: true } },
      toolingSets: { orderBy: { setNumber: 'asc' } },
      costEstimation: true,
    },
    orderBy: { feasibilityLineId: 'asc' },
  },
} satisfies Prisma.FeasibilityStudyInclude;

@Injectable()
export class FeasibilityStudyService {
  constructor(private prisma: PrismaService) {}

  private async createLine(
    tx: Prisma.TransactionClient,
    studyId: number,
    studyEnquiryId: number,
    line: CreateFeasibilityLineDto,
  ) {
    const enquiryLine = await tx.enquiryLine.findUnique({ where: { lineId: line.enquiryLineId } });
    if (!enquiryLine) {
      throw new BadRequestException(`Enquiry line #${line.enquiryLineId} not found`);
    }
    if (enquiryLine.enquiryId !== studyEnquiryId) {
      throw new BadRequestException(
        `Enquiry line #${line.enquiryLineId} does not belong to this study's enquiry`,
      );
    }

    const created = await tx.feasibilityLine.create({
      data: {
        studyId,
        enquiryLineId: line.enquiryLineId,
        recommendedMachineId: line.recommendedMachineId,
        billetWeightEstKg: line.billetWeightEstKg,
        flashAllowancePct: line.flashAllowancePct,
        flagsRisks: line.flagsRisks,
        overallVerdict: line.overallVerdict,
        verdictRemarks: line.verdictRemarks,
      },
    });

    await this.replaceProcesses(tx, created.feasibilityLineId, line.processIds);
    await this.replaceToolingSets(tx, created.feasibilityLineId, line.toolingSets);
    if (line.costEstimation) {
      await tx.costEstimation.create({
        data: { feasibilityLineId: created.feasibilityLineId, ...line.costEstimation },
      });
    }

    return created;
  }

  private async replaceProcesses(
    tx: Prisma.TransactionClient,
    feasibilityLineId: number,
    processIds: number[] | undefined,
  ) {
    if (processIds === undefined) return;
    await tx.feasibilityLineProcess.deleteMany({ where: { feasibilityLineId } });
    if (processIds.length) {
      await tx.feasibilityLineProcess.createMany({
        data: processIds.map((processId) => ({ feasibilityLineId, processId })),
      });
    }
  }

  private async replaceToolingSets(
    tx: Prisma.TransactionClient,
    feasibilityLineId: number,
    toolingSets: CreateFeasibilityLineDto['toolingSets'],
  ) {
    if (toolingSets === undefined) return;
    await tx.toolingSet.deleteMany({ where: { feasibilityLineId } });
    for (const [index, ts] of toolingSets.entries()) {
      await tx.toolingSet.create({
        data: {
          feasibilityLineId,
          setNumber: ts.setNumber ?? index + 1,
          dieDrawingStatus: ts.dieDrawingStatus,
          estimatedDieCost: ts.estimatedDieCost,
          dieAmortisationQty: ts.dieAmortisationQty,
          dieAmortisationPerPc: ts.dieAmortisationPerPc,
          dieRemarks: ts.dieRemarks,
        },
      });
    }
  }

  async create(dto: CreateFeasibilityStudyDto) {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { enquiryId: dto.enquiryId } });
    if (!enquiry) throw new NotFoundException(`Enquiry #${dto.enquiryId} not found`);

    const existing = await this.prisma.feasibilityStudy.findUnique({
      where: { enquiryId: dto.enquiryId },
    });
    if (existing) {
      throw new BadRequestException(`Enquiry #${dto.enquiryId} already has a feasibility study`);
    }

    return this.prisma.$transaction(async (tx) => {
      const study = await tx.feasibilityStudy.create({
        data: {
          enquiryId: dto.enquiryId,
          assessedBy: dto.assessedBy,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : undefined,
          studyStatus: dto.studyStatus as FeasibilityStudyStatus | undefined,
          reviewedBy: dto.reviewedBy,
          reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : undefined,
        },
      });

      for (const line of dto.lines ?? []) {
        await this.createLine(tx, study.studyId, dto.enquiryId, line);
      }

      return tx.feasibilityStudy.findUnique({
        where: { studyId: study.studyId },
        include: studyInclude,
      });
    });
  }

  async findAll(enquiryId?: number) {
    const studies = await this.prisma.feasibilityStudy.findMany({
      where: enquiryId ? { enquiryId } : undefined,
      include: {
        enquiry: { include: { customer: true } },
        feasibilityLines: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return studies.map((study) => ({
      studyId: study.studyId,
      enquiryId: study.enquiryId,
      enquiryNumber: study.enquiry.enquiryNumber,
      customer: study.enquiry.customer.companyName,
      studyStatus: study.studyStatus,
      lines: study.feasibilityLines.length,
      assessmentDate: study.assessmentDate,
      reviewedBy: study.reviewedBy,
      createdAt: study.createdAt,
      updatedAt: study.updatedAt,
    }));
  }

  async findOne(id: number) {
    const study = await this.prisma.feasibilityStudy.findUnique({
      where: { studyId: id },
      include: studyInclude,
    });
    if (!study) throw new NotFoundException(`Feasibility study #${id} not found`);
    return study;
  }

  private async syncLines(
    tx: Prisma.TransactionClient,
    studyId: number,
    studyEnquiryId: number,
    lines: UpdateFeasibilityLineDto[],
  ) {
    const existing = await tx.feasibilityLine.findMany({ where: { studyId } });
    const keepIds = new Set(lines.filter((l) => l.feasibilityLineId).map((l) => l.feasibilityLineId));

    const toRemove = existing.filter((l) => !keepIds.has(l.feasibilityLineId));
    if (toRemove.length) {
      await tx.feasibilityLine.deleteMany({
        where: { feasibilityLineId: { in: toRemove.map((l) => l.feasibilityLineId) } },
      });
    }

    for (const line of lines) {
      if (line.feasibilityLineId) {
        await tx.feasibilityLine.update({
          where: { feasibilityLineId: line.feasibilityLineId },
          data: {
            recommendedMachineId: line.recommendedMachineId,
            billetWeightEstKg: line.billetWeightEstKg,
            flashAllowancePct: line.flashAllowancePct,
            flagsRisks: line.flagsRisks,
            overallVerdict: line.overallVerdict,
            verdictRemarks: line.verdictRemarks,
          },
        });

        await this.replaceProcesses(tx, line.feasibilityLineId, line.processIds);
        await this.replaceToolingSets(tx, line.feasibilityLineId, line.toolingSets);

        if (line.costEstimation) {
          await tx.costEstimation.upsert({
            where: { feasibilityLineId: line.feasibilityLineId },
            update: line.costEstimation,
            create: { feasibilityLineId: line.feasibilityLineId, ...line.costEstimation },
          });
        }
      } else {
        if (!line.enquiryLineId || !line.recommendedMachineId) {
          throw new BadRequestException(
            'enquiryLineId and recommendedMachineId are required for a new feasibility line',
          );
        }
        await this.createLine(tx, studyId, studyEnquiryId, line as CreateFeasibilityLineDto);
      }
    }
  }

  async update(id: number, dto: UpdateFeasibilityStudyDto) {
    const current = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.feasibilityStudy.update({
        where: { studyId: id },
        data: {
          assessedBy: dto.assessedBy,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : undefined,
          studyStatus: dto.studyStatus as FeasibilityStudyStatus | undefined,
          reviewedBy: dto.reviewedBy,
          reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : undefined,
        },
      });

      if (dto.lines) {
        await this.syncLines(tx, id, current.enquiryId, dto.lines);
      }

      return tx.feasibilityStudy.findUnique({
        where: { studyId: id },
        include: studyInclude,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.feasibilityStudy.delete({ where: { studyId: id } });
  }
}
