import { Body, ConflictException, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';

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
        select: { userId: true, fullName: true, email: true, role: true, isActive: true },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw err;
    }
  }
}
