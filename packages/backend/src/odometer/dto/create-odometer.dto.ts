import { IsString, IsInt, Min, IsUUID, IsDateString } from 'class-validator';

export class CreateOdometerDto {
  @IsUUID()
  fahrzeugId: string;

  @IsDateString()
  datum: string;

  @IsInt()
  @Min(0)
  kmStand: number;
}
