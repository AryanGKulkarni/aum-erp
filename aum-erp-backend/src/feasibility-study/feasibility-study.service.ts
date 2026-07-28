import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeasibilityStudyDto } from './dto/create-feasibility-study.dto';
import { UpdateFeasibilityStudyDto } from './dto/update-feasibility-study.dto';
import { PartStatus } from '@prisma/client';

@Injectable()
export class FeasibilityStudyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeasibilityStudyDto) {
    if (!dto.partId && !dto.part) {
      throw new BadRequestException('Either partId or part details must be provided');
    }

    return this.prisma.$transaction(async (tx) => {
      let partId = dto.partId;

      if (!partId) {
        const partData = dto.part!;
        const newPart = await tx.part.create({
          data: {
            customerId: partData.customerId,
            partName: partData.partName,
            partDrawingNumber: partData.partDrawingNumber,
            materialGrade: partData.materialGrade,
            forgingWeightKg: partData.forgingWeightKg,
            finishWeightKg: partData.finishWeightKg,
            billetDiameterMm: partData.billetDiameterMm,
            billetLengthMm: partData.billetLengthMm,
            noOfOperations: partData.noOfOperations,
            partStatus: PartStatus.Under_Feasibility,
          },
        });
        partId = newPart.partId;
      }

      const verdictToStatus: Record<string, PartStatus> = {
        Feasible: PartStatus.Feasible,
        Not_Feasible: PartStatus.Not_Feasible,
        Conditional: PartStatus.Under_Feasibility,
      };

      if (dto.overallVerdict) {
        await tx.part.update({
          where: { partId },
          data: { partStatus: verdictToStatus[dto.overallVerdict] },
        });
      }

      const study = await tx.feasibilityStudy.create({
        data: {
          partId,
          assessedBy: dto.assessedBy,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : undefined,
          recommendedMachine: dto.recommendedMachine,
          billetWeightEstKg: dto.billetWeightEstKg,
          flashAllowancePct: dto.flashAllowancePct,
          materialUtilisationPct: dto.materialUtilisationPct,
          cycleTimeMin: dto.cycleTimeMin,
          machineLoadHrsMonth: dto.machineLoadHrsMonth,
          availableCapacityHrs: dto.availableCapacityHrs,
          capacityFeasible: dto.capacityFeasible,
          flagsRisks: dto.flagsRisks,
          overallVerdict: dto.overallVerdict,
          verdictRemarks: dto.verdictRemarks,
        },
      });

      if (dto.costEstimation) {
        await tx.costEstimation.create({
          data: {
            feasibilityId: study.feasibilityId,
            rmRatePerKg: dto.costEstimation.rmRatePerKg,
            rmCostPerPc: dto.costEstimation.rmCostPerPc,
            dieCostPerPc: dto.costEstimation.dieCostPerPc,
            machineCostPerPc: dto.costEstimation.machineCostPerPc,
            labourCostPerPc: dto.costEstimation.labourCostPerPc,
            overheadPct: dto.costEstimation.overheadPct,
            overheadPerPc: dto.costEstimation.overheadPerPc,
            totalCostPerPc: dto.costEstimation.totalCostPerPc,
            marginPct: dto.costEstimation.marginPct,
            quotedPricePerPc: dto.costEstimation.quotedPricePerPc,
          },
        });
      }

      return tx.feasibilityStudy.findUnique({
        where: { feasibilityId: study.feasibilityId },
        include: { part: true, costEstimations: true },
      });
    });
  }

  async findAll(partId?: number) {
    const studies = await this.prisma.feasibilityStudy.findMany({
      where: partId ? { partId } : undefined,
      include: {
        part: { include: { customer: true } },
        costEstimations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return studies.map((study) => ({
      feasibilityId: study.feasibilityId,
      part: {
        name: study.part.partName,
        drawingNumber: study.part.partDrawingNumber ?? null,
      },
      customer: study.part.customer?.companyName ?? null,
      machine: study.recommendedMachine,
      materialUtilisationPct: study.materialUtilisationPct,
      quotedPrice: study.costEstimations[0]?.quotedPricePerPc ?? null,
      capacityFeasible: study.capacityFeasible,
      overallVerdict: study.overallVerdict,
    }));
  }

  async findOne(id: number) {
    const study = await this.prisma.feasibilityStudy.findUnique({
      where: { feasibilityId: id },
      include: {
        part: { include: { customer: true, attachments: { orderBy: { uploadedAt: 'desc' } } } },
        costEstimations: true,
      },
    });
    if (!study) throw new NotFoundException(`Feasibility study #${id} not found`);
    return study;
  }

  async update(id: number, dto: UpdateFeasibilityStudyDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const verdictToStatus: Record<string, PartStatus> = {
        Feasible: PartStatus.Feasible,
        Not_Feasible: PartStatus.Not_Feasible,
        Conditional: PartStatus.Under_Feasibility,
      };

      const study = await tx.feasibilityStudy.update({
        where: { feasibilityId: id },
        data: {
          assessedBy: dto.assessedBy,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : undefined,
          recommendedMachine: dto.recommendedMachine,
          billetWeightEstKg: dto.billetWeightEstKg,
          flashAllowancePct: dto.flashAllowancePct,
          materialUtilisationPct: dto.materialUtilisationPct,
          cycleTimeMin: dto.cycleTimeMin,
          machineLoadHrsMonth: dto.machineLoadHrsMonth,
          availableCapacityHrs: dto.availableCapacityHrs,
          capacityFeasible: dto.capacityFeasible,
          flagsRisks: dto.flagsRisks,
          overallVerdict: dto.overallVerdict,
          verdictRemarks: dto.verdictRemarks,
        },
        include: { part: true },
      });

      if (dto.overallVerdict) {
        await tx.part.update({
          where: { partId: study.partId },
          data: { partStatus: verdictToStatus[dto.overallVerdict] },
        });
      }

      if (dto.costEstimation) {
        const existing = await tx.costEstimation.findFirst({
          where: { feasibilityId: id },
        });
        if (existing) {
          await tx.costEstimation.update({
            where: { costId: existing.costId },
            data: dto.costEstimation,
          });
        } else {
          await tx.costEstimation.create({
            data: { feasibilityId: id, ...dto.costEstimation },
          });
        }
      }

      return tx.feasibilityStudy.findUnique({
        where: { feasibilityId: id },
        include: { part: true, costEstimations: true },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.feasibilityStudy.delete({ where: { feasibilityId: id } });
  }
}
