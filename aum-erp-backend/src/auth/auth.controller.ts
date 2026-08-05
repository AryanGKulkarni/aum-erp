import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-oauth.guard';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  path: '/' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Send JWT login token to email' })
  @ApiBody({ schema: { example: { email: 'user@example.com' } } })
  @ApiResponse({ status: 200, description: 'Login token sent to the provided email' })
  @ApiResponse({ status: 404, description: 'No account found with this email' })
  @Public()
  @Post('email')
  @HttpCode(200)
  async emailLogin(@Body('email') email: string) {
    await this.authService.sendEmailToken(email);
    return { message: 'Login token sent to your email' };
  }

  @ApiOperation({ summary: 'Verify a magic-link login token and log the user in' })
  @ApiResponse({ status: 302, description: 'Redirects to the app, with a session cookie set' })
  @Public()
  @Get('verify')
  async verifyEmailLogin(@Query('token') token: string, @Res() res: Response) {
    try {
      const { sessionToken } = await this.authService.verifyEmailToken(token);
      res.cookie('auth_token', sessionToken, SESSION_COOKIE_OPTIONS);
      return res.redirect(`${FRONTEND_URL}/dashboard`);
    } catch {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }
  }

  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @ApiOperation({ summary: 'Google OAuth callback — logs the user in and redirects to the app' })
  @ApiResponse({ status: 302, description: 'Redirects to the app, with a session cookie set' })
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    const sessionToken = this.authService.issueSessionToken(req.user);
    res.cookie('auth_token', sessionToken, SESSION_COOKIE_OPTIONS);
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  }

  @ApiOperation({ summary: 'Get the currently logged-in user' })
  @ApiResponse({
    status: 200,
    schema: { example: { userId: 1, fullName: 'John Doe', email: 'user@example.com', role: 'Sales' } },
  })
  @ApiResponse({ status: 401, description: 'Not logged in / session expired' })
  @Get('me')
  me(@Req() req: Request & { user: { userId: number; fullName: string; email: string | null; role: string } }) {
    const { userId, fullName, email, role } = req.user;
    return { userId, fullName, email, role };
  }

  @ApiOperation({ summary: 'Log out — clears the session cookie' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.json({ message: 'Logged out' });
  }
}
