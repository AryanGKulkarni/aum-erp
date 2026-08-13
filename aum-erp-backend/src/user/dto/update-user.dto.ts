import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() email?: string;

  @ApiPropertyOptional({ enum: ['Sales', 'Engineering', 'Costing', 'Admin'] })
  role?: 'Sales' | 'Engineering' | 'Costing' | 'Admin';

  @ApiPropertyOptional() isActive?: boolean;
}
