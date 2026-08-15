import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;

  const userRepo = {
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(),
    update: jest.fn(),
  };

  const roleRepo = {
    findOne: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string) => fallback || key),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers a new customer', async () => {
    userRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue({ id: 'role-1', name: UserRole.CUSTOMER });
    userRepo.save.mockImplementation(async (u) => ({
      ...u,
      id: 'user-1',
      role: { name: UserRole.CUSTOMER },
    }));

    const result = await service.register({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'Password@123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
    expect(result.user.email).toBe('jane@example.com');
    expect(userRepo.save).toHaveBeenCalled();
  });

  it('rejects duplicate email on register', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'Password@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isActive: true,
      isDeleted: false,
      role: { name: UserRole.CUSTOMER },
    });
    userRepo.update.mockResolvedValue({});

    const result = await service.login({
      email: 'jane@example.com',
      password: 'Password@123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('jane@example.com');
  });

  it('rejects invalid login password', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isActive: true,
      role: { name: UserRole.CUSTOMER },
    });

    await expect(
      service.login({ email: 'jane@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
