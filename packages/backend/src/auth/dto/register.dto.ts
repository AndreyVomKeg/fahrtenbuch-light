import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['ADMIN', 'BENUTZER'])
  role?: string;

  @IsOptional()
  @IsIn(['de', 'en', 'ru'])
  lang?: string;
}
