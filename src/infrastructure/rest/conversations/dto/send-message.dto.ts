import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty({ example: 'Hola! ¿Cómo estás?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text!: string;
}

export class SendMessageResponseDto {
  @ApiProperty({ example: '7b6a0ce3-0f1b-4c4b-8952-9e3c3df1e9b1' })
  id!: string;
}
