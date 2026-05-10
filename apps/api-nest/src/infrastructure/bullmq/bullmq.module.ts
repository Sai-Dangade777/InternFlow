import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>("app.redis.host", "127.0.0.1");
        const port = configService.get<number>("app.redis.port", 6379);
        const password = configService.get<string>("app.redis.password", "");
        const tlsEnabled = configService.get<boolean>("app.redis.tls", false);

        return {
          prefix: configService.get<string>("app.bullmq.prefix", "internflow"),
          connection: {
            host,
            port,
            password: password || undefined,
            tls: tlsEnabled ? {} : undefined
          },
          defaultJobOptions: configService.get("app.bullmq.defaultJobOptions")
        };
      }
    })
  ]
})
export class BullmqModule {}
