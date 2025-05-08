import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ParamsDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  repo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
