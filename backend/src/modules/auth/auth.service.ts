import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isDeleted: false },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const roleName = dto.role === UserRole.ADMIN ? UserRole.CUSTOMER : (dto.role || UserRole.CUSTOMER);
    const role = await this.roleRepo.findOne({
      where: { name: roleName, isDeleted: false },
    });
    if (!role) {
      throw new BadRequestException(`Role ${roleName} not found. Run seed first.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      phone: dto.phone || null,
      roleId: role.id,
      createdBy: null,
      isDeleted: false,
    });
    const saved = await this.userRepo.save(user);
    saved.role = role;
    const tokens = await this.issueTokens(saved);
    await this.persistRefreshToken(saved.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(saved),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isDeleted: false },
      relations: ['role'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isDeleted: false },
      relations: ['role'],
    });
    if (!user || !user.refreshTokenHash || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshTokenHash: null, updatedBy: userId });
    return { success: true };
  }

  private async issueTokens(user: User) {
    const roleName = user.role?.name || UserRole.CUSTOMER;
    const payload = { sub: user.id, email: user.email, role: roleName };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET', 'change-me'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as `${number}m`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as `${number}d`,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, { refreshTokenHash: hash });
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role?.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
