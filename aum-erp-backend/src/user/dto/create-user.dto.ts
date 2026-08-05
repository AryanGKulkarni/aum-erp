import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty() fullName!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: ['Sales', 'Engineering', 'Costing', 'Admin'] })
  role!: 'Sales' | 'Engineering' | 'Costing' | 'Admin';
}
