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
import { FacebookService } from '../facebook/facebook.service';

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
    private readonly facebook: FacebookService,
  ) {}

  /** Never expose encrypted Page tokens in API responses. */
  sanitizeShop<T extends Partial<Shop> | null | undefined>(shop: T): T {
    if (!shop || typeof shop !== 'object') return shop;
    const copy = { ...shop } as T & { facebookPageAccessToken?: string | null };
    if ('facebookPageAccessToken' in copy) {
      delete copy.facebookPageAccessToken;
    }
    return copy;
  }

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
        website: dto.website || null,
        instagramUrl: dto.instagramUrl || null,
        facebookUrl: dto.facebookUrl || null,
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
      website: dto.website || null,
      instagramUrl: dto.instagramUrl || null,
      facebookUrl: dto.facebookUrl || null,
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
    return paginate(
      data.map((s) => this.sanitizeShop(s)),
      total,
      page,
      limit,
    );
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
    return this.sanitizeShop(shop);
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
    const sanitizedShops = shops.map((s) => this.sanitizeShop(s));
    return { ...this.sanitizeShop(primary), shops: sanitizedShops };
  }

  async getOwnedPrimaryShop(ownerId: string): Promise<Shop> {
    const shop = await this.shopRepo.findOne({
      where: { ownerId, isDeleted: false },
      order: { createdDate: 'ASC' },
    });
    if (!shop) throw new NotFoundException('Shop not found for this user');
    return shop;
  }

  async assertOwnedShop(shopId: string, actorId: string, role: string): Promise<Shop> {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId, isDeleted: false },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    return shop;
  }

  getFacebookAuthUrl(userId: string, shopId: string) {
    this.facebook.assertOAuthReady();
    return { url: this.facebook.getAuthUrl(userId, shopId) };
  }

  async getFacebookStatus(shop: Shop) {
    const shopConnected = Boolean(
      shop.facebookPageId && shop.facebookPageName,
    );

    return {
      connected: shopConnected,
      canPost: this.facebook.isPublishEnabled() && shopConnected,
      pageId: shop.facebookPageId || null,
      pageName: shop.facebookPageName || null,
      connectedAt: shop.facebookConnectedAt || null,
      configured: this.facebook.isReady(),
      oauthReady: this.facebook.isOAuthReady(),
      publishEnabled: this.facebook.isPublishEnabled(),
      mode: shopConnected ? ('shop' as const) : ('none' as const),
    };
  }

  /** Each business configures their own Page access token. */
  async configureFacebookPage(
    actorId: string,
    role: string,
    pageAccessToken: string,
    pageId?: string,
  ) {
    this.facebook.assertPublishReady();
    const shop = await this.getOwnedPrimaryShop(actorId);
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }

    const page = await this.facebook.resolvePageFromToken(
      pageAccessToken,
      pageId,
    );
    await this.saveFacebookPage(
      shop.id,
      page.pageId,
      page.pageName,
      pageAccessToken.trim(),
      actorId,
    );
    const refreshed = await this.getOwnedPrimaryShop(actorId);
    return this.getFacebookStatus(refreshed);
  }

  /** Load shop including encrypted Page token (for posting). */
  async getShopWithFacebookToken(shopId: string): Promise<Shop> {
    const shop = await this.shopRepo
      .createQueryBuilder('shop')
      .addSelect('shop.facebookPageAccessToken')
      .where('shop.id = :id', { id: shopId })
      .andWhere('shop.isDeleted = :deleted', { deleted: false })
      .getOne();
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async handleFacebookCallback(code: string, state: string) {
    const { userId, shopId } = this.facebook.verifyState(state);
    await this.assertOwnedShop(shopId, userId, UserRole.BUSINESS_OWNER);
    const pages = await this.facebook.exchangeCodeForPages(code);

    if (pages.length === 1) {
      await this.saveFacebookPage(shopId, pages[0].id, pages[0].name, pages[0].accessToken, userId);
      return {
        redirectPath: '/business?facebook=connected',
      };
    }

    const connectToken = this.facebook.createPendingConnect(userId, shopId, pages);
    return {
      redirectPath: `/business?facebook=select&connectToken=${encodeURIComponent(connectToken)}`,
    };
  }

  listFacebookPendingPages(connectToken: string, userId: string) {
    const pending = this.facebook.getPendingConnect(connectToken);
    if (pending.userId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    return {
      shopId: pending.shopId,
      pages: this.facebook.listPendingPages(connectToken),
    };
  }

  async selectFacebookPage(
    actorId: string,
    role: string,
    pageId: string,
    connectToken?: string,
  ) {
    if (!connectToken) {
      throw new BadRequestException('connectToken is required to select a Facebook Page');
    }
    const pending = this.facebook.consumePendingConnect(connectToken);
    if (role !== UserRole.ADMIN && pending.userId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    await this.assertOwnedShop(pending.shopId, actorId, role);
    const page = pending.pages.find((p) => p.id === pageId);
    if (!page) {
      throw new BadRequestException('Selected Facebook Page is not in the authorized list');
    }
    await this.saveFacebookPage(
      pending.shopId,
      page.id,
      page.name,
      page.accessToken,
      actorId,
    );
    const connected = await this.shopRepo.findOne({
      where: { id: pending.shopId, isDeleted: false },
    });
    if (!connected) throw new NotFoundException('Shop not found');
    return this.getFacebookStatus(connected);
  }

  async disconnectFacebook(actorId: string, role: string) {
    const shop = await this.getOwnedPrimaryShop(actorId);
    if (role !== UserRole.ADMIN && shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    await this.shopRepo.update(
      { id: shop.id },
      {
        facebookPageId: null,
        facebookPageName: null,
        facebookPageAccessToken: null,
        facebookConnectedAt: null,
        updatedBy: actorId,
      },
    );
    const refreshed = await this.getOwnedPrimaryShop(actorId);
    return this.getFacebookStatus(refreshed);
  }

  private async saveFacebookPage(
    shopId: string,
    pageId: string,
    pageName: string,
    accessToken: string,
    actorId: string,
  ) {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId, isDeleted: false },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    await this.shopRepo.update(
      { id: shopId },
      {
        facebookPageId: pageId,
        facebookPageName: pageName,
        facebookPageAccessToken: this.facebook.encryptToken(accessToken),
        facebookConnectedAt: new Date(),
        updatedBy: actorId,
      },
    );
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
    if (dto.website !== undefined) shop.website = dto.website || null;
    if (dto.instagramUrl !== undefined) shop.instagramUrl = dto.instagramUrl || null;
    if (dto.facebookUrl !== undefined) shop.facebookUrl = dto.facebookUrl || null;
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

  async updatePosAccess(id: string, posEnabled: boolean, actorId: string) {
    const shop = await this.findOne(id);
    shop.posEnabled = posEnabled;
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
