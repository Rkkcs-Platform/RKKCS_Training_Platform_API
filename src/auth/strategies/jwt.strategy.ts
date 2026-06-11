import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../common/enums';
import { User, UserDocument } from '../../schemas/user.schema';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.userModel.findById(payload.sub).exec();

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or inactive account');
    }

    return user;
  }
}
