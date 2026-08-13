/*
  Warnings:

  - You are about to drop the column `available_capacity_hrs` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `billet_diameter_mm` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `billet_length_mm` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `capacity_feasible` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `cycle_time_min` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `finish_weight_kg` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `forging_weight_kg` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `machine_load_hrs_month` on the `feasibility_lines` table. All the data in the column will be lost.
  - You are about to drop the column `material_utilisation_pct` on the `feasibility_lines` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "feasibility_lines" DROP COLUMN "available_capacity_hrs",
DROP COLUMN "billet_diameter_mm",
DROP COLUMN "billet_length_mm",
DROP COLUMN "capacity_feasible",
DROP COLUMN "cycle_time_min",
DROP COLUMN "finish_weight_kg",
DROP COLUMN "forging_weight_kg",
DROP COLUMN "machine_load_hrs_month",
DROP COLUMN "material_utilisation_pct";

-- DropEnum
DROP TYPE "CapacityFeasibility";
