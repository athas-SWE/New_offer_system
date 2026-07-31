import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Shop } from '../modules/shops/entities/shop.entity';
import { District } from '../modules/locations/entities/district.entity';
import { City } from '../modules/locations/entities/city.entity';
import { UserRole } from '../common/enums/role.enum';
import { ShopStatus } from '../common/enums/shop-status.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('SEED_ON_BOOT') !== 'false';
    if (!enabled) return;
    try {
      await this.seedRoles();
      await this.seedLocations();
      await this.seedAdmin();
      await this.seedShopOwner();
    } catch (error) {
      this.logger.warn(`Seed skipped/failed: ${(error as Error).message}`);
    }
  }

  private async seedRoles() {
    const roles = [
      { name: UserRole.ADMIN, description: 'Platform administrator' },
      { name: UserRole.BUSINESS_OWNER, description: 'Shop owner' },
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

  private async seedLocations() {
    const allowedCitySlugs = [
      'kalmunai',
      'maruthamunai',
      'sainthamaruthu',
      'ampara-city',
      'ninthavur',
      'sammanthurai',
      'pottuvil',
      'akkaraipattu',
      'karaithivu',
    ];

    // Soft-delete any cities outside the Ampara coastal list
    const allCities = await this.cityRepo.find({ where: { isDeleted: false } });
    for (const city of allCities) {
      if (!allowedCitySlugs.includes(city.slug)) {
        city.isDeleted = true;
        city.isActive = false;
        await this.cityRepo.save(city);
        this.logger.log(`Removed city from list: ${city.name}`);
      }
    }

    let district = await this.districtRepo.findOne({
      where: { slug: 'ampara', isDeleted: false },
    });
    if (!district) {
      district = await this.districtRepo.save(
        this.districtRepo.create({
          name: 'Ampara',
          slug: 'ampara',
          province: 'Eastern',
          isActive: true,
          isDeleted: false,
        }),
      );
      this.logger.log('Seeded district: Ampara');
    }

    const cities: Array<{ name: string; slug: string }> = [
      { name: 'Kalmunai', slug: 'kalmunai' },
      { name: 'Maruthamunai', slug: 'maruthamunai' },
      { name: 'Sainthamaruthu', slug: 'sainthamaruthu' },
      { name: 'Ampara', slug: 'ampara-city' },
      { name: 'Ninthavur', slug: 'ninthavur' },
      { name: 'Sammanthurai', slug: 'sammanthurai' },
      { name: 'Pottuvil', slug: 'pottuvil' },
      { name: 'Akkaraipattu', slug: 'akkaraipattu' },
      { name: 'Karaithivu', slug: 'karaithivu' },
    ];

    for (const c of cities) {
      const existing = await this.cityRepo.findOne({
        where: { slug: c.slug },
      });
      if (!existing) {
        await this.cityRepo.save(
          this.cityRepo.create({
            name: c.name,
            slug: c.slug,
            districtId: district.id,
            isActive: true,
            isDeleted: false,
          }),
        );
        this.logger.log(`Seeded city: ${c.name}`);
      } else if (existing.isDeleted || !existing.isActive) {
        existing.isDeleted = false;
        existing.isActive = true;
        existing.name = c.name;
        existing.districtId = district.id;
        await this.cityRepo.save(existing);
        this.logger.log(`Restored city: ${c.name}`);
      }
    }
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

  private async seedShopOwner() {
    const owner = await this.ensureUser({
      email: 'business@offerlanka.lk',
      password: 'Business@12345',
      name: 'Demo Shop Owner',
      role: UserRole.BUSINESS_OWNER,
    });
    if (!owner) return;

    const existing = await this.shopRepo.findOne({
      where: { ownerId: owner.id, isDeleted: false },
    });
    if (existing) {
      if (existing.status !== ShopStatus.APPROVED || !existing.isActive) {
        existing.status = ShopStatus.APPROVED;
        existing.isActive = true;
        await this.shopRepo.save(existing);
        this.logger.log(`Approved demo shop: ${existing.name}`);
      }
      return;
    }

    await this.shopRepo.save(
      this.shopRepo.create({
        name: 'Colombo Demo Shop',
        description: 'Seeded demo shop for Offer Lanka shop dashboard.',
        email: 'business@offerlanka.lk',
        phone: '+94771234567',
        address: 'Galle Road, Colombo 03',
        status: ShopStatus.APPROVED,
        isActive: true,
        ownerId: owner.id,
        isDeleted: false,
      }),
    );
    this.logger.log('Seeded demo shop: Colombo Demo Shop');
  }
}
