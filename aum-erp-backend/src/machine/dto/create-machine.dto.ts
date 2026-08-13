import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMachineDto {
  @ApiProperty() machineName!: string;

  @ApiProperty({ enum: ['Press', 'Drop_Hammer'] })
  machineType!: 'Press' | 'Drop_Hammer';

  @ApiPropertyOptional() capacityTons?: number;
  @ApiPropertyOptional() availableHrsPerDay?: number;
  @ApiPropertyOptional() workingDaysPerMonth?: number;

  // availableHrsPerMonth is a generated STORED column — computed by Postgres,
  // never accepted from the client.

  @ApiPropertyOptional({ enum: ['Active', 'Under_Maintenance', 'Idle'] })
  status?: 'Active' | 'Under_Maintenance' | 'Idle';
}
