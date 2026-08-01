import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Shop } from './entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../../common/enums/role.enum';
import { ShopStatus } from '../../common/enums/shop-status.enum';
import {
  RegisterShopDto,
  CreateShopDto,
  UpdateShopDto,
  UpdateShopStatusDto,
  ShopQueryDto,
} from './dto/shop.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { resolveLocationFields } from './utils/parse-maps-url';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterShopDto) {
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.ownerEmail.toLowerCase(), isDeleted: false },
    });
    if (existingEmail) {
      throw new ConflictException('Owner email already registered');
    }

    const role = await this.roleRepo.findOne({
      where: { name: UserRole.BUSINESS_OWNER, isDeleted: false },
    });
    if (!role) {
      throw new BadRequestException('BUSINESS_OWNER role missing. Run seed.');
    }

    const savedShop = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        name: dto.ownerName,
        email: dto.ownerEmail.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.ownerPassword, 12),
        phone: dto.ownerPhone || null,
        roleId: role.id,
        isDeleted: false,
      });
      const savedUser = await manager.save(user);
      const location = resolveLocationFields({ locationUrl: dto.locationUrl });

      const shop = manager.create(Shop, {
        name: dto.name,
        description: dto.description || null,
        registrationNumber: dto.registrationNumber || null,
        email: dto.email || dto.ownerEmail.toLowerCase(),
        phone: dto.phone || dto.ownerPhone || null,
        address: dto.address || null,
        locationUrl: location.locationUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        cityId: dto.cityId || null,
        ownerId: savedUser.id,
        status: ShopStatus.PENDING,
        isActive: true,
        createdBy: savedUser.id,
        isDeleted: false,
      });
      return manager.save(shop);
    });

    return this.findOne(savedShop.id);
  }

  async create(dto: CreateShopDto, actorId: string, role: string) {
    if (role !== UserRole.ADMIN && role !== UserRole.BUSINESS_OWNER) {
      throw new ForbiddenException('Not allowed');
    }
    const location = resolveLocationFields({
      locationUrl: dto.locationUrl,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    const shop = this.shopRepo.create({
      name: dto.name,
      description: dto.description || null,
      address: dto.address || null,
      locationUrl: location.locationUrl,
      phone: dto.phone || null,
      email: dto.email || null,
      latitude: location.latitude,
      longitude: location.longitude,
      cityId: dto.cityId || null,
      ownerId: actorId,
      status: role === UserRole.ADMIN ? ShopStatus.APPROVED : ShopStatus.PENDING,
      isActive: true,
      createdBy: actorId,
      isDeleted: false,
    });
    const saved = await this.shopRepo.save(shop);
    return this.findOne(saved.id);
  }

  async findAll(query: ShopQueryDto, publicOnly = false) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.shopRepo
      .createQueryBuilder('shop')
      .leftJoin('shop.owner', 'owner')
      .addSelect(['owner.id', 'owner.name', 'owner.email', 'owner.phone'])
      .leftJoinAndSelect('shop.city', 'city')
      .where('shop.isDeleted = :deleted', { deleted: false });

    if (publicOnly) {
      qb.andWhere('shop.status = :status', { status: ShopStatus.APPROVED });
      qb.andWhere('shop.isActive = :active', { active: true });
    } else if (query.status) {
      qb.andWhere('shop.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('shop.name LIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('shop.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const shop = await this.shopRepo
      .createQueryBuilder('shop')
      .leftJoin('shop.owner', 'owner')
      .addSelect(['owner.id', 'owner.name', 'owner.email', 'owner.phone'])
      .leftJoinAndSelect('shop.city', 'city')
      .where('shop.id = :id', { id })
      .andWhere('shop.isDeleted = :deleted', { deleted: false })
      .getOne();
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async findMine(ownerId: string) {
    const shops = await this.shopRepo.find({
      where: { ownerId, isDeleted: false },
      relations: ['city'],
      order: { createdDate: 'ASC' },
    });
    if (!shops.length) throw new NotFoundException('Shop not found for this user');
    // Primary shop + siblings for dashboard compatibility
    const primary = shops[0];
    return { ...primary, shops };
  }

  async update(id: string, dto: UpdateShopDto, actorId: string, role: string) {
    const shop = await this.findOne(id);
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to update this shop');
    }

    if (dto.name !== undefined) shop.name = dto.name;
    if (dto.description !== undefined) shop.description = dto.description;
    if (dto.address !== undefined) shop.address = dto.address;
    if (dto.phone !== undefined) shop.phone = dto.phone;
    if (dto.email !== undefined) shop.email = dto.email;
    if (dto.logoUrl !== undefined) shop.logoUrl = dto.logoUrl;
    if (dto.cityId !== undefined) shop.cityId = dto.cityId;
    if (dto.isActive !== undefined) shop.isActive = dto.isActive;

    if (
      dto.locationUrl !== undefined ||
      dto.latitude !== undefined ||
      dto.longitude !== undefined
    ) {
      const location = resolveLocationFields({
        locationUrl:
          dto.locationUrl !== undefined ? dto.locationUrl : shop.locationUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });
      shop.locationUrl = location.locationUrl;
      if (dto.latitude !== undefined || dto.longitude !== undefined) {
        shop.latitude = location.latitude;
        shop.longitude = location.longitude;
      } else if (
        dto.locationUrl !== undefined &&
        location.latitude != null &&
        location.longitude != null
      ) {
        shop.latitude = location.latitude;
        shop.longitude = location.longitude;
      }
    }

    shop.updatedBy = actorId;
    await this.shopRepo.save(shop);
    return this.findOne(id);
  }

  async updateLogo(id: string, logoUrl: string, actorId: string, role: string) {
    const shop = await this.findOne(id);
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to update this shop');
    }
    shop.logoUrl = logoUrl;
    shop.updatedBy = actorId;
    await this.shopRepo.save(shop);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateShopStatusDto, actorId: string) {
    const shop = await this.findOne(id);
    shop.status = dto.status;
    shop.updatedBy = actorId;
    await this.shopRepo.save(shop);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const shop = await this.findOne(id);
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    shop.isDeleted = true;
    shop.isActive = false;
    shop.updatedBy = actorId;
    await this.shopRepo.save(shop);
    return { success: true };
  }

  async findOwnedShopIds(ownerId: string): Promise<string[]> {
    const shops = await this.shopRepo.find({
      where: { ownerId, isDeleted: false },
      select: ['id'],
    });
    return shops.map((s) => s.id);
  }
}
