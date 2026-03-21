import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateFahrzeugDto {
  @IsString()
  @MaxLength(15)
  @Matches(/^[A-ZÄÖÜ]{1,3}\s[A-Z]{1,2}\s\d{1,4}[EH]?$/, {
    message: 'Kennzeichen must match German plate format (e.g. B AB 1234)',
  })
  kennzeichen: string;

  @IsString()
  @MaxLength(50)
  marke: string;

  @IsString()
  @MaxLength(50)
  modell: string;

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

  @IsInt()
  @Min(0)
  kmInitial: number;
}
