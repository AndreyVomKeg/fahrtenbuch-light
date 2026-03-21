import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateFahrzeugDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  marke?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modell?: string;

  @IsOptional()
  @IsString()
  @MaxLength(17)
  vin?: string;

  @IsOptional()
  @IsIn(['BENZIN', 'DIESEL', 'ELEKTRO', 'HYBRID'])
  kraftstoff?: string;

  @IsOptional()
  @IsString()
  tuvDatum?: string;
}
