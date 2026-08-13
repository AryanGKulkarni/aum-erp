import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Full record, for the Masters screen. The plain list stays trimmed because it
// also backs the "Received By" / "Assessed By" dropdowns.
const mastersSelect = {
  userId: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'List active users' })
  @Get()
  findAll() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { userId: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  }

  @ApiOperation({ summary: 'List all users including inactive ones (Admin only)' })
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @Get('all')
  findAllIncludingInactive() {
    return this.prisma.user.findMany({
      select: mastersSelect,
      orderBy: { fullName: 'asc' },
    });
  }

  @ApiOperation({ summary: 'Create a new user and assign their role (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 403, description: 'Only admins can create users' })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: { fullName: dto.fullName, email: dto.email, role: dto.role },
        select: mastersSelect,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw err;
    }
  }

  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { userId: id },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          role: dto.role,
          isActive: dto.isActive,
        },
        select: mastersSelect,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      if (err?.code === 'P2025') {
        throw new NotFoundException(`User #${id} not found`);
      }
      throw err;
    }
  }
}
