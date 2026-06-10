import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole, UserStatus } from '../common/enums';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

export interface AuthUserResponse {
  id: string;
  name: string;
  staffCode?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt?: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.userModel.findOne({ email }).exec();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (dto.staffCode) {
      const existingStaffCode = await this.userModel.findOne({ staffCode: dto.staffCode}).exec();
      if (existingStaffCode) {
        throw new ConflictException('Staff code already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      staffCode: dto.staffCode?.trim() || '',
      passwordHash,
      role: dto.role || UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  getProfile(user: UserDocument): AuthUserResponse {
    return this.toUserResponse(user);
  }

  logout(): { message: string } {
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid or inactive account');
      }

      return this.buildTokenPair(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private buildAuthResponse(user: UserDocument): AuthResponse {
    const tokens = this.buildTokenPair(user);

    return {
      ...tokens,
      user: this.toUserResponse(user),
    };
  }

  private buildTokenPair(user: UserDocument): RefreshTokenResponse {
    const basePayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );

    const accessToken = this.jwtService.sign(
      { ...basePayload, type: 'access' } satisfies JwtPayload,
      { expiresIn: accessExpiresIn as `${number}h` },
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: 'refresh' } satisfies JwtPayload,
      {
        secret: this.getRefreshSecret(),
        expiresIn: refreshExpiresIn as `${number}d`,
      },
    );

    return { accessToken, refreshToken };
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      `${this.configService.getOrThrow<string>('JWT_SECRET')}_refresh`
    );
  }

  private toUserResponse(user: UserDocument): AuthUserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt,
      staffCode: user.staffCode || ''
    };
  }
}
