import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'DUMMY_CLIENT_ID';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_CLIENT_SECRET';
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });

    if (clientID === 'DUMMY_CLIENT_ID' || clientSecret === 'DUMMY_CLIENT_SECRET') {
      this.logger.warn(
        'WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in your env! Google Sign-in redirect will fail until these are provided.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = await this.authService.validateUser({
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0]?.value,
    });
    done(null, user);
  }
}
