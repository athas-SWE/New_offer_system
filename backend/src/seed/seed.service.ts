import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Business } from '../modules/businesses/entities/business.entity';
import { UserRole } from '../common/enums/role.enum';
import { BusinessStatus } from '../common/enums/business-status.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('SEED_ON_BOOT') !== 'false';
    if (!enabled) return;
    try {
      await this.seedRoles();
      await this.seedAdmin();
      await this.seedBusinessOwner();
      await this.seedShopper();
    } catch (error) {
      this.logger.warn(`Seed skipped/failed: ${(error as Error).message}`);
    }
  }

  private async seedRoles() {
    const roles = [
      { name: UserRole.ADMIN, description: 'Platform administrator' },
      { name: UserRole.BUSINESS_OWNER, description: 'Business owner' },
      { name: UserRole.CUSTOMER, description: 'End customer / shopper' },
    ];

    for (const role of roles) {
      const existing = await this.roleRepo.findOne({
        where: { name: role.name, isDeleted: false },
      });
      if (!existing) {
        await this.roleRepo.save(
          this.roleRepo.create({ ...role, isDeleted: false }),
        );
        this.logger.log(`Seeded role: ${role.name}`);
      }
    }
  }

  private async ensureUser(params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<User | null> {
    const email = params.email.toLowerCase();
    const existing = await this.userRepo.findOne({
      where: { email, isDeleted: false },
      relations: ['role'],
    });
    if (existing) return existing;

    const role = await this.roleRepo.findOne({
      where: { name: params.role, isDeleted: false },
    });
    if (!role) return null;

    const saved = await this.userRepo.save(
      this.userRepo.create({
        name: params.name,
        email,
        passwordHash: await bcrypt.hash(params.password, 12),
        roleId: role.id,
        isActive: true,
        isDeleted: false,
      }),
    );
    this.logger.log(`Seeded user: ${email} (${params.role})`);
    return saved;
  }

  private async seedAdmin() {
    await this.ensureUser({
      email:
        this.configService.get<string>('SEED_ADMIN_EMAIL') ||
        'admin@offerlanka.lk',
      password:
        this.configService.get<string>('SEED_ADMIN_PASSWORD') || 'Admin@12345',
      name:
        this.configService.get<string>('SEED_ADMIN_NAME') || 'System Admin',
      role: UserRole.ADMIN,
    });
  }

  private async seedBusinessOwner() {
    const owner = await this.ensureUser({
      email: 'business@offerlanka.lk',
      password: 'Business@12345',
      name: 'Demo Business Owner',
      role: UserRole.BUSINESS_OWNER,
    });
    if (!owner) return;

    const existingBiz = await this.businessRepo.findOne({
      where: { ownerId: owner.id, isDeleted: false },
    });
    if (existingBiz) return;

    await this.businessRepo.save(
      this.businessRepo.create({
        name: 'Colombo Demo Store',
        description: 'Seeded demo business for Offer Lanka business dashboard.',
        email: 'business@offerlanka.lk',
        phone: '+94771234567',
        address: 'Galle Road, Colombo 03',
        status: BusinessStatus.APPROVED,
        ownerId: owner.id,
        isDeleted: false,
      }),
    );
    this.logger.log('Seeded demo business: Colombo Demo Store');
  }

  private async seedShopper() {
    await this.ensureUser({
      email: 'shopper@offerlanka.lk',
      password: 'Shopper@12345',
      name: 'Demo Shopper',
      role: UserRole.CUSTOMER,
    });
  }
}
