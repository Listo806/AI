import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';

// Public form submission. NO team/account id is accepted here — the owning account is
// resolved server-side from the form row, so a submitter can never target another
// account. Only the submitted field data is trusted, and only as opaque values.
// Top-level lengths are bounded here; the service additionally strips NUL bytes and
// deep-bounds `data` so hostile input yields a clean 400/ignore, never a 500.
export class PublicFormSubmissionDto {
  @IsOptional() @IsString() @MaxLength(320) email?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsObject() data?: Record<string, any>;
}
