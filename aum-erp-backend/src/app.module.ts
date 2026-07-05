import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailService } from './services/email.service';
import { FeasibilityStudyModule } from './feasibility-study/feasibility-study.module';

@Module({
  imports: [PrismaModule, AuthModule, FeasibilityStudyModule],
  controllers: [AppController],
  providers: [AppService, EmailService],
  exports: [EmailService],
})
export class AppModule { }

