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
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt?: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUserResponse;
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

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      passwordHash,
      role: UserRole.USER,
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

  private buildAuthResponse(user: UserDocument): AuthResponse {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn as `${number}d`,
    });

    return {
      accessToken,
      user: this.toUserResponse(user),
    };
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
    };
  }
}
