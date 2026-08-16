import { IsOptional, IsString, IsIn, IsObject } from 'class-validator';

// Connect/disconnect a marketing integration. This only records the account's own
// connection status — it never fabricates external-platform performance data.
export class ConnectMktIntegrationDto {
  @IsString() provider!: string;
  @IsOptional() @IsIn(['connected', 'not_connected']) status?: string;
  @IsOptional() @IsString() externalAccount?: string;
  @IsOptional() @IsObject() config?: Record<string, any>;
}
