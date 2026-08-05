-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('Submitted', 'Under Feasibility', 'Feasible', 'Not Feasible', 'Enquiry Raised');

-- CreateEnum
CREATE TYPE "DieDrawingStatus" AS ENUM ('Customer Provides', 'To Be Developed', 'Existing Die');

-- CreateEnum
CREATE TYPE "OverallVerdict" AS ENUM ('Feasible', 'Not Feasible', 'Conditional');

-- CreateEnum
CREATE TYPE "FeasibilityStudyStatus" AS ENUM ('Draft', 'Submitted for Review', 'Reviewed', 'Quoted');

-- CreateEnum
CREATE TYPE "CapacityFeasibility" AS ENUM ('Yes', 'Over Capacity', 'Not Assessed');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('Draft', 'Open', 'Under Feasibility', 'Quoted', 'Won', 'Lost', 'On Hold');

-- CreateEnum
CREATE TYPE "SupplyType" AS ENUM ('With Material', 'Labour');

-- CreateEnum
CREATE TYPE "DeliveryState" AS ENUM ('As Forged', 'Machined');

-- CreateEnum
CREATE TYPE "LineStatus" AS ENUM ('Pending Feasibility', 'Assessed', 'Quoted', 'Dropped');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Revised', 'Expired');

-- CreateEnum
CREATE TYPE "TimelineStatus" AS ENUM ('Done', 'In Progress', 'Pending');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('Press', 'Drop Hammer');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('Active', 'Under Maintenance', 'Idle');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Sales', 'Engineering', 'Costing', 'Admin');

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
    "customer_id" INTEGER NOT NULL,
    "part_name" VARCHAR(150) NOT NULL,
    "part_drawing_number" VARCHAR(50),
    "material_grade" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("part_id")
);

-- CreateTable
CREATE TABLE "part_attachments" (
    "attachment_id" SERIAL NOT NULL,
    "part_id" INTEGER NOT NULL,
    "enquiry_line_id" INTEGER,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(10),
    "file_size_kb" INTEGER,
    "uploaded_by" INTEGER,
    "uploaded_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "part_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "tooling_sets" (
    "tooling_id" SERIAL NOT NULL,
    "feasibility_line_id" INTEGER NOT NULL,
    "set_number" INTEGER NOT NULL,
    "die_drawing_status" "DieDrawingStatus",
    "estimated_die_cost" DECIMAL(12,2),
    "die_amortisation_qty" INTEGER,
    "die_amortisation_per_pc" DECIMAL(10,2),
    "die_remarks" TEXT,

    CONSTRAINT "tooling_sets_pkey" PRIMARY KEY ("tooling_id")
);

-- CreateTable
CREATE TABLE "feasibility_studies" (
    "study_id" SERIAL NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "assessed_by" INTEGER,
    "assessment_date" DATE,
    "study_status" "FeasibilityStudyStatus" NOT NULL DEFAULT 'Draft',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "feasibility_studies_pkey" PRIMARY KEY ("study_id")
);

-- CreateTable
CREATE TABLE "feasibility_lines" (
    "feasibility_line_id" SERIAL NOT NULL,
    "study_id" INTEGER NOT NULL,
    "enquiry_line_id" INTEGER NOT NULL,
    "forging_weight_kg" DECIMAL(8,3),
    "finish_weight_kg" DECIMAL(8,3),
    "billet_diameter_mm" DECIMAL(6,2),
    "billet_length_mm" DECIMAL(6,2),
    "recommended_machine_id" INTEGER NOT NULL,
    "billet_weight_est_kg" DECIMAL(8,3),
    "flash_allowance_pct" DECIMAL(5,2),
    "material_utilisation_pct" DECIMAL(5,2),
    "cycle_time_min" DECIMAL(6,2),
    "machine_load_hrs_month" DECIMAL(8,2),
    "available_capacity_hrs" DECIMAL(8,2),
    "capacity_feasible" "CapacityFeasibility" DEFAULT 'Not Assessed',
    "flags_risks" TEXT,
    "overall_verdict" "OverallVerdict",
    "verdict_remarks" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "feasibility_lines_pkey" PRIMARY KEY ("feasibility_line_id")
);

-- CreateTable
CREATE TABLE "feasibility_line_processes" (
    "feasibility_line_id" INTEGER NOT NULL,
    "process_id" INTEGER NOT NULL,

    CONSTRAINT "feasibility_line_processes_pkey" PRIMARY KEY ("feasibility_line_id","process_id")
);

-- CreateTable
CREATE TABLE "cost_estimations" (
    "cost_id" SERIAL NOT NULL,
    "feasibility_line_id" INTEGER NOT NULL,
    "rm_diameter_mm" DECIMAL(6,2),
    "forging_yield_pct" DECIMAL(5,2),
    "forging_weight_kg" DECIMAL(8,3),
    "cut_pc_weight_kg" DECIMAL(8,3),
    "gross_weight_kg" DECIMAL(8,3),
    "rm_rate_per_kg" DECIMAL(10,2),
    "die_factor_per_pc" DECIMAL(10,2),
    "cutting_cost_factor_per_cm2" DECIMAL(10,4),
    "forging_conversion_per_kg" DECIMAL(10,2),
    "ht_factor_per_kg" DECIMAL(10,2),
    "visual_inspection_per_pc" DECIMAL(10,2),
    "rejection_factor_pct" DECIMAL(5,2),
    "icc_factor_pct" DECIMAL(5,2),
    "transportation_factor_pct" DECIMAL(5,2),
    "profit_on_va_factor_pct" DECIMAL(5,2),
    "scrap_factor_per_kg" DECIMAL(10,2),
    "rm_cost" DECIMAL(12,2),
    "cutting_cost" DECIMAL(12,2),
    "forging_conversion_cost" DECIMAL(12,2),
    "ht_shotblast_cost" DECIMAL(12,2),
    "visual_inspection_cost" DECIMAL(12,2),
    "value_addition" DECIMAL(12,2),
    "sub_total" DECIMAL(12,2),
    "rejection_cost" DECIMAL(12,2),
    "icc_cost" DECIMAL(12,2),
    "transportation_cost" DECIMAL(12,2),
    "profit_on_va" DECIMAL(12,2),
    "scrap_amount" DECIMAL(12,2),
    "quoted_price_per_pc" DECIMAL(12,2),
    "calculated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "cost_estimations_pkey" PRIMARY KEY ("cost_id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "enquiry_id" SERIAL NOT NULL,
    "enquiry_number" VARCHAR(20) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "enquiry_date" DATE NOT NULL,
    "received_by" INTEGER,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'Draft',
    "lost_reason" TEXT,
    "remarks" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("enquiry_id")
);

-- CreateTable
CREATE TABLE "enquiry_lines" (
    "enquiry_line_id" SERIAL NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "line_number" INTEGER NOT NULL,
    "part_id" INTEGER NOT NULL,
    "supply_type" "SupplyType" NOT NULL,
    "qty_per_month" INTEGER,
    "qty_per_year" INTEGER,
    "suggested_machine_id" INTEGER,
    "delivery_state" "DeliveryState",
    "special_requirements" TEXT,
    "line_remarks" TEXT,
    "line_status" "LineStatus" DEFAULT 'Pending Feasibility',

    CONSTRAINT "enquiry_lines_pkey" PRIMARY KEY ("enquiry_line_id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "quotation_id" SERIAL NOT NULL,
    "quotation_number" VARCHAR(20) NOT NULL,
    "study_id" INTEGER NOT NULL,
    "enquiry_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "revision_no" INTEGER NOT NULL DEFAULT 1,
    "quotation_date" DATE NOT NULL,
    "valid_until" DATE,
    "prepared_by" INTEGER,
    "quotation_status" "QuotationStatus" NOT NULL DEFAULT 'Draft',
    "sent_on" DATE,
    "accepted_on" DATE,
    "rejected_on" DATE,
    "payment_terms" VARCHAR(100),
    "delivery_terms" VARCHAR(100),
    "total_monthly_value" DECIMAL(14,2),
    "annual_estimate" DECIMAL(14,2),
    "customer_feedback" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("quotation_id")
);

-- CreateTable
CREATE TABLE "quotation_lines" (
    "quotation_line_id" SERIAL NOT NULL,
    "quotation_id" INTEGER NOT NULL,
    "line_number" INTEGER NOT NULL,
    "feasibility_line_id" INTEGER NOT NULL,
    "part_name" VARCHAR(150) NOT NULL,
    "part_drawing_number" VARCHAR(50),
    "material_grade" VARCHAR(50),
    "processes_text" VARCHAR(200),
    "rm_diameter_mm" DECIMAL(6,2),
    "forging_yield_pct" DECIMAL(5,2),
    "forging_weight_kg" DECIMAL(8,3),
    "cut_pc_weight_kg" DECIMAL(8,3),
    "gross_weight_kg" DECIMAL(8,3),
    "rm_rate_per_kg" DECIMAL(10,2),
    "die_factor_per_pc" DECIMAL(10,2),
    "cutting_cost_factor_per_cm2" DECIMAL(10,4),
    "forging_conversion_per_kg" DECIMAL(10,2),
    "ht_factor_per_kg" DECIMAL(10,2),
    "visual_inspection_per_pc" DECIMAL(10,2),
    "rejection_factor_pct" DECIMAL(5,2),
    "icc_factor_pct" DECIMAL(5,2),
    "transportation_factor_pct" DECIMAL(5,2),
    "profit_on_va_factor_pct" DECIMAL(5,2),
    "scrap_factor_per_kg" DECIMAL(10,2),
    "rm_cost" DECIMAL(12,2),
    "cutting_cost" DECIMAL(12,2),
    "forging_conversion_cost" DECIMAL(12,2),
    "ht_shotblast_cost" DECIMAL(12,2),
    "visual_inspection_cost" DECIMAL(12,2),
    "value_addition" DECIMAL(12,2),
    "sub_total" DECIMAL(12,2),
    "rejection_cost" DECIMAL(12,2),
    "icc_cost" DECIMAL(12,2),
    "transportation_cost" DECIMAL(12,2),
    "profit_on_va" DECIMAL(12,2),
    "scrap_amount" DECIMAL(12,2),
    "cost_per_pc" DECIMAL(12,2),
    "qty_per_month" INTEGER,
    "monthly_value" DECIMAL(14,2),
    "development_cost" DECIMAL(12,2),

    CONSTRAINT "quotation_lines_pkey" PRIMARY KEY ("quotation_line_id")
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
    "status" "MachineStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "machines_pkey" PRIMARY KEY ("machine_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "processes" (
    "process_id" SERIAL NOT NULL,
    "process_code" VARCHAR(30) NOT NULL,
    "process_name" VARCHAR(60) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("process_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_gst_number_key" ON "customers"("gst_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_customer_drawing" ON "parts"("customer_id", "part_drawing_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_line_set" ON "tooling_sets"("feasibility_line_id", "set_number");

-- CreateIndex
CREATE UNIQUE INDEX "feasibility_studies_enquiry_id_key" ON "feasibility_studies"("enquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_study_line" ON "feasibility_lines"("study_id", "enquiry_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_estimations_feasibility_line_id_key" ON "cost_estimations"("feasibility_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiry_number_key" ON "enquiries"("enquiry_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_enquiry_line" ON "enquiry_lines"("enquiry_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_quotation_revision" ON "quotations"("quotation_number", "revision_no");

-- CreateIndex
CREATE UNIQUE INDEX "uk_quotation_line" ON "quotation_lines"("quotation_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_quotation_feasline" ON "quotation_lines"("quotation_id", "feasibility_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "processes_process_code_key" ON "processes"("process_code");

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_attachments" ADD CONSTRAINT "part_attachments_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("part_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_attachments" ADD CONSTRAINT "part_attachments_enquiry_line_id_fkey" FOREIGN KEY ("enquiry_line_id") REFERENCES "enquiry_lines"("enquiry_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_attachments" ADD CONSTRAINT "part_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooling_sets" ADD CONSTRAINT "tooling_sets_feasibility_line_id_fkey" FOREIGN KEY ("feasibility_line_id") REFERENCES "feasibility_lines"("feasibility_line_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_studies" ADD CONSTRAINT "feasibility_studies_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_studies" ADD CONSTRAINT "feasibility_studies_assessed_by_fkey" FOREIGN KEY ("assessed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_studies" ADD CONSTRAINT "feasibility_studies_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_lines" ADD CONSTRAINT "feasibility_lines_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "feasibility_studies"("study_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_lines" ADD CONSTRAINT "feasibility_lines_enquiry_line_id_fkey" FOREIGN KEY ("enquiry_line_id") REFERENCES "enquiry_lines"("enquiry_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_lines" ADD CONSTRAINT "feasibility_lines_recommended_machine_id_fkey" FOREIGN KEY ("recommended_machine_id") REFERENCES "machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_line_processes" ADD CONSTRAINT "feasibility_line_processes_feasibility_line_id_fkey" FOREIGN KEY ("feasibility_line_id") REFERENCES "feasibility_lines"("feasibility_line_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_line_processes" ADD CONSTRAINT "feasibility_line_processes_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("process_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimations" ADD CONSTRAINT "cost_estimations_feasibility_line_id_fkey" FOREIGN KEY ("feasibility_line_id") REFERENCES "feasibility_lines"("feasibility_line_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_lines" ADD CONSTRAINT "enquiry_lines_suggested_machine_id_fkey" FOREIGN KEY ("suggested_machine_id") REFERENCES "machines"("machine_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "feasibility_studies"("study_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("quotation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_feasibility_line_id_fkey" FOREIGN KEY ("feasibility_line_id") REFERENCES "feasibility_lines"("feasibility_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_timeline" ADD CONSTRAINT "enquiry_timeline_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;

