import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailService } from './services/email.service';
import { FeasibilityStudyModule } from './feasibility-study/feasibility-study.module';
import { EnquiryModule } from './enquiry/enquiry.module';
import { QuotationModule } from './quotation/quotation.module';
import { CustomerModule } from './customer/customer.module';
import { PartModule } from './part/part.module';
import { MachineModule } from './machine/machine.module';
import { UserModule } from './user/user.module';
import { ProcessModule } from './process/process.module';

@Module({
  imports: [PrismaModule, AuthModule, FeasibilityStudyModule, EnquiryModule, QuotationModule, CustomerModule, PartModule, MachineModule, UserModule, ProcessModule],
  controllers: [AppController],
  providers: [AppService, EmailService],
  exports: [EmailService],
})
export class AppModule { }

