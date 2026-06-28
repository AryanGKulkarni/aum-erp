import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-oauth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @ApiOperation({ summary: 'Google OAuth callback — returns logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    schema: {
      example: {
        message: 'User logged in successfully via Google!',
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          picture: 'https://...',
        },
      },
    },
  })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req) {
    return {
      message: 'User logged in successfully via Google!',
      user: req.user,
    };
  }
}
