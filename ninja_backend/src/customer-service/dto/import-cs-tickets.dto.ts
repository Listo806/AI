import { IsArray, ArrayMaxSize } from 'class-validator';

// Bulk ticket import. Elements are validated per-row in the service (which forwards
// only safe free-text fields and always uses the caller's own team), so the array
// itself is only shape/size-checked here to cap abuse.
export class ImportCsTicketsDto {
  @IsArray()
  @ArrayMaxSize(1000)
  tickets!: any[];
}
