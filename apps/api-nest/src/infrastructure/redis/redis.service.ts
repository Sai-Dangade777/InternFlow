import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { RedisOptions } from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("app.redis.host", "127.0.0.1");
    const port = this.configService.get<number>("app.redis.port", 6379);
    const password = this.configService.get<string>("app.redis.password", "");
    const tlsEnabled = this.configService.get<boolean>("app.redis.tls", false);

    const options: RedisOptions = { host, port };
    if (password) {
      options.password = password;
    }
    if (tlsEnabled) {
      options.tls = {};
    }

    this.client = new Redis(options);
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
