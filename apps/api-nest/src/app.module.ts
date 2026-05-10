import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import configuration from "./config/configuration";
import { validationSchema } from "./config/validation";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { SupabaseModule } from "./infrastructure/supabase/supabase.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { BullmqModule } from "./infrastructure/bullmq/bullmq.module";
import { AuthModule } from "./modules/auth/auth.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";
import { CandidatesModule } from "./modules/candidates/candidates.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { ResumeAiModule } from "./modules/resume-ai/resume-ai.module";
import { NdaModule } from "./modules/nda/nda.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ProvisioningModule } from "./modules/provisioning/provisioning.module";
import { CertificatesModule } from "./modules/certificates/certificates.module";
import { MentorModule } from "./modules/mentor/mentor.module";
import { AiInsightsModule } from "./modules/ai-insights/ai-insights.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { abortEarly: false },
      envFilePath: [".env", ".env.local"]
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>("app.logLevel", "info"),
          transport:
            configService.get<string>("app.nodeEnv") === "development"
              ? {
                  target: "pino-pretty",
                  options: { colorize: true, singleLine: true }
                }
              : undefined
        }
      })
    }),
    PrismaModule,
    SupabaseModule,
    RedisModule,
    BullmqModule,
    AuthModule,
    RolesModule,
    UsersModule,
    CandidatesModule,
    ReferralsModule,
    WorkflowsModule,
    ResumeAiModule,
    NdaModule,
    DocumentsModule,
    NotificationsModule,
    AuditModule,
    ProvisioningModule,
    CertificatesModule,
    MentorModule,
    AiInsightsModule
  ]
})
export class AppModule {}
