import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['IN', 'OUT'], example: 'IN' })
  direction: 'IN' | 'OUT';

  @ApiProperty({ example: 'hola' })
  content: string;

  @ApiProperty({ example: '2026-01-31T12:00:00.000Z' })
  createdAt: string;
}

export class ListMessagesResponseDto {
  @ApiProperty({ type: [MessageDto] })
  items: MessageDto[];

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
