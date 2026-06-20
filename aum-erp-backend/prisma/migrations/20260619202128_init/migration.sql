-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('Submitted', 'Under Feasibility', 'Feasible', 'Not Feasible', 'Enquiry Raised');

-- CreateEnum
CREATE TYPE "DieDrawingAvailable" AS ENUM ('Customer Provides', 'To Be Developed', 'Existing Die');

-- CreateEnum
CREATE TYPE "RecommendedMachine" AS ENUM ('1000T Press', '0.75T Belt Hammer');

-- CreateEnum
CREATE TYPE "OverallVerdict" AS ENUM ('Feasible', 'Not Feasible', 'Conditional');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('Open', 'Feasibility', 'Quoted', 'Won', 'Lost', 'On Hold');

-- CreateEnum
CREATE TYPE "SuggestedMachine" AS ENUM ('1000T Press', '0.75T Belt Hammer', 'TBD');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Revised');

-- CreateEnum
CREATE TYPE "TimelineStatus" AS ENUM ('Done', 'In Progress', 'Pending');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('Press', 'Drop Hammer');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('Active', 'Under Maintenance', 'Idle');

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(100),
    "phone" VARCHAR(15),
    "email" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(50),
    "gst_number" VARCHAR(20),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "parts" (
    "part_id" SERIAL NOT NULL,
    "customer_id" INTEGER,
    "part_name" VARCHAR(150) NOT NULL,
    "part_drawing_number" VARCHAR(50),
    "material_grade" VARCHAR(50),
    "forging_weight_kg" DECIMAL(8,3),
    "finish_weight_kg" DECIMAL(8,3),
    "billet_diameter_mm" DECIMAL(6,2),
    "billet_length_mm" DECIMAL(6,2),
    "no_of_operations" INTEGER,
    "part_status" "PartStatus" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("part_id")
);

-- CreateTable
CREATE TABLE "tooling_details" (
    "tooling_id" SERIAL NOT NULL,
    "part_id" INTEGER NOT NULL,
    "die_drawing_available" "DieDrawingAvailable",
    "estimated_die_cost" DECIMAL(12,2),
    "die_amortisation_qty" INTEGER,
    "die_amortisation_per_pc" DECIMAL(8,2),
    "die_remarks" TEXT,

    CONSTRAINT "tooling_details_pkey" PRIMARY KEY ("tooling_id")
);

-- CreateTable
CREATE TABLE "feasibility_study" (
    "feasibility_id" SERIAL NOT NULL,
    "part_id" INTEGER NOT NULL,
    "assessed_by" VARCHAR(100),
    "assessment_date" DATE,
    "recommended_machine" "RecommendedMachine",
    "billet_weight_est_kg" DECIMAL(8,3),
    "flash_allowance_pct" DECIMAL(5,2),
    "material_utilisation_pct" DECIMAL(5,2),
    "cycle_time_min" DECIMAL(6,2),
    "machine_load_hrs_month" DECIMAL(8,2),
    "available_capacity_hrs" DECIMAL(8,2),
    "capacity_feasible" BOOLEAN,
    "flags_risks" TEXT,
    "overall_verdict" "OverallVerdict",
    "verdict_remarks" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feasibility_study_pkey" PRIMARY KEY ("feasibility_id")
);

-- CreateTable
CREATE TABLE "cost_estimation" (
    "cost_id" SERIAL NOT NULL,
    "feasibility_id" INTEGER NOT NULL,
    "rm_rate_per_kg" DECIMAL(10,2),
    "rm_cost_per_pc" DECIMAL(10,2),
    "die_cost_per_pc" DECIMAL(10,2),
    "machine_cost_per_pc" DECIMAL(10,2),
    "labour_cost_per_pc" DECIMAL(10,2),
    "overhead_pct" DECIMAL(5,2),
    "overhead_per_pc" DECIMAL(10,2),
    "total_cost_per_pc" DECIMAL(10,2),
    "margin_pct" DECIMAL(5,2),
    "quoted_price_per_pc" DECIMAL(10,2),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_estimation_pkey" PRIMARY KEY ("cost_id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "enquiry_id" SERIAL NOT NULL,
    "enquiry_number" VARCHAR(20) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "enquiry_date" DATE NOT NULL,
    "received_by" VARCHAR(100),
    "status" "EnquiryStatus" NOT NULL,
    "lost_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("enquiry_id")
);

-- CreateTable
CREATE TABLE "enquiry_lines" (
    "line_id" SERIAL NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "part_id" INTEGER NOT NULL,
    "feasibility_id" INTEGER,
    "qty_per_month" INTEGER,
    "qty_per_year" INTEGER,
    "suggested_machine" "SuggestedMachine",
    "heat_treatment_required" BOOLEAN NOT NULL DEFAULT false,
    "heat_treatment_spec" VARCHAR(200),
    "special_requirements" TEXT,
    "line_remarks" TEXT,

    CONSTRAINT "enquiry_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "quotation_id" SERIAL NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "quotation_number" VARCHAR(20) NOT NULL,
    "quotation_date" DATE,
    "valid_until" DATE,
    "prepared_by" VARCHAR(100),
    "total_quoted_value" DECIMAL(14,2),
    "payment_terms" VARCHAR(100),
    "delivery_terms" VARCHAR(100),
    "quotation_status" "QuotationStatus",
    "sent_on" DATE,
    "customer_feedback" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("quotation_id")
);

-- CreateTable
CREATE TABLE "enquiry_timeline" (
    "timeline_id" SERIAL NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "stage" VARCHAR(100) NOT NULL,
    "status" "TimelineStatus" NOT NULL,
    "action_by" VARCHAR(100),
    "action_date" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "enquiry_timeline_pkey" PRIMARY KEY ("timeline_id")
);

-- CreateTable
CREATE TABLE "machines" (
    "machine_id" SERIAL NOT NULL,
    "machine_name" VARCHAR(100) NOT NULL,
    "machine_type" "MachineType" NOT NULL,
    "capacity_tons" DECIMAL(8,2),
    "available_hrs_per_day" DECIMAL(4,2),
    "working_days_per_month" INTEGER,
    "available_hrs_per_month" DECIMAL(8,2),
    "status" "MachineStatus" NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("machine_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_gst_number_key" ON "customers"("gst_number");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiry_number_key" ON "enquiries"("enquiry_number");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooling_details" ADD CONSTRAINT "tooling_details_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("part_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_study" ADD CONSTRAINT "feasibility_study_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("part_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimation" ADD CONSTRAINT "cost_estimation_feasibility_id_fkey" FOREIGN KEY ("feasibility_id") REFERENCES "feasibility_study"("feasibility_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("part_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_feasibility_id_fkey" FOREIGN KEY ("feasibility_id") REFERENCES "feasibility_study"("feasibility_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_timeline" ADD CONSTRAINT "enquiry_timeline_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;
