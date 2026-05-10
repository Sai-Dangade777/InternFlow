import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient | null = null;
  private readonly anonClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>("app.supabase.url", "");
    const anonKey = this.configService.get<string>("app.supabase.anonKey", "");
    const serviceRoleKey = this.configService.get<string>(
      "app.supabase.serviceRoleKey",
      ""
    );

    if (url) {
      this.adminClient = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      this.anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    } else {
      // Leave clients as null for local dev without Supabase credentials
      this.adminClient = null;
      this.anonClient = null;
    }
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error("Supabase admin client not configured");
    }
    return this.adminClient;
  }

  getAnonClient(): SupabaseClient {
    if (!this.anonClient) {
      throw new Error("Supabase anon client not configured");
    }
    return this.anonClient;
  }
}
