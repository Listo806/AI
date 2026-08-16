import { IsString, MaxLength } from 'class-validator';

// Ask a question answered ONLY from this account's marketing data. Retrieval is
// strictly team-scoped in the service — one account can never see another's data.
export class MktAiQueryDto {
  @IsString() @MaxLength(1000) question!: string;
}
