import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './google-oauth.guard';

@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth login flow (handled by guard)
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req) {
    // Returns authenticated user details loaded by GoogleStrategy
    return {
      message: 'User logged in successfully via Google!',
      user: req.user,
    };
  }
}
