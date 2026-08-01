import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty() companyName!: string;
  @ApiPropertyOptional() contactPerson?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() gstNumber?: string;
}
