import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>("app.supabase.url", "");
    const anonKey = this.configService.get<string>("app.supabase.anonKey", "");
    const serviceRoleKey = this.configService.get<string>(
      "app.supabase.serviceRoleKey",
      ""
    );

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    this.anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }
}
