import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('SEED_ON_BOOT') !== 'false';
    if (!enabled) return;
    try {
      await this.seedRoles();
      await this.seedAdmin();
    } catch (error) {
      this.logger.warn(`Seed skipped/failed: ${(error as Error).message}`);
    }
  }

  private async seedRoles() {
    const roles = [
      { name: UserRole.ADMIN, description: 'Platform administrator' },
      { name: UserRole.BUSINESS_OWNER, description: 'Business owner' },
      { name: UserRole.CUSTOMER, description: 'End customer' },
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

  private async seedAdmin() {
    const email = (
      this.configService.get<string>('SEED_ADMIN_EMAIL') ||
      'admin@offerlanka.lk'
    ).toLowerCase();

    const existing = await this.userRepo.findOne({
      where: { email, isDeleted: false },
    });
    if (existing) return;

    const adminRole = await this.roleRepo.findOne({
      where: { name: UserRole.ADMIN, isDeleted: false },
    });
    if (!adminRole) return;

    const password =
      this.configService.get<string>('SEED_ADMIN_PASSWORD') || 'Admin@12345';
    const name =
      this.configService.get<string>('SEED_ADMIN_NAME') || 'System Admin';

    await this.userRepo.save(
      this.userRepo.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        roleId: adminRole.id,
        isActive: true,
        isDeleted: false,
      }),
    );
    this.logger.log(`Seeded admin user: ${email}`);
  }
}
