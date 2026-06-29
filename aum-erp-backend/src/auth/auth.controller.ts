import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-oauth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Send JWT login token to email' })
  @ApiBody({ schema: { example: { email: 'user@example.com' } } })
  @ApiResponse({ status: 200, description: 'Login token sent to the provided email' })
  @ApiResponse({ status: 404, description: 'No account found with this email' })
  @Post('email')
  @HttpCode(200)
  async emailLogin(@Body('email') email: string) {
    await this.authService.sendEmailToken(email);
    return { message: 'Login token sent to your email' };
  }

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
