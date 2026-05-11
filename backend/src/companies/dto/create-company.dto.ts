import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  symbol!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
