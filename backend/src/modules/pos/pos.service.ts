import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PosProduct } from './entities/pos-product.entity';
import { PosSale } from './entities/pos-sale.entity';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { Shop } from '../shops/entities/shop.entity';
import {
  CreatePosProductDto,
  UpdatePosProductDto,
  PosProductQueryDto,
  CreatePosSaleDto,
  PosSaleQueryDto,
} from './dto/pos.dto';
import { UserRole } from '../../common/enums/role.enum';
import { PosPaymentMethod } from '../../common/enums/pos-payment-method.enum';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(PosProduct)
    private readonly productRepo: Repository<PosProduct>,
    @InjectRepository(PosSale)
    private readonly saleRepo: Repository<PosSale>,
    @InjectRepository(PosSaleItem)
    private readonly saleItemRepo: Repository<PosSaleItem>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly dataSource: DataSource,
  ) {}

  async createProduct(dto: CreatePosProductDto, actorId: string, role: string) {
    const shop = await this.resolvePosShop(dto.shopId, actorId, role);

    const product = this.productRepo.create({
      name: dto.name.trim(),
      sku: dto.sku?.trim() || null,
      price: Number(dto.price),
      stock: dto.stock === undefined ? null : dto.stock,
      image: dto.image || null,
      isActive: dto.isActive ?? true,
      shopId: shop.id,
      createdBy: actorId,
      isDeleted: false,
    });

    const saved = await this.productRepo.save(product);
    return this.findProduct(saved.id, actorId, role);
  }

  async listProducts(
    query: PosProductQueryDto,
    actorId: string,
    role: string,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const shopIds = await this.resolveAccessibleShopIds(query.shopId, actorId, role);

    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.isDeleted = :deleted', { deleted: false })
      .andWhere('product.shopId IN (:...shopIds)', { shopIds });

    if (query.activeOnly) {
      qb.andWhere('product.isActive = :active', { active: true });
    }
    if (query.search) {
      qb.andWhere('(product.name LIKE :search OR product.sku LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findProduct(id: string, actorId: string, role: string) {
    const product = await this.productRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!product) throw new NotFoundException('POS product not found');
    await this.assertShopAccess(product.shopId, actorId, role, false);
    return product;
  }

  async updateProduct(
    id: string,
    dto: UpdatePosProductDto,
    actorId: string,
    role: string,
  ) {
    const product = await this.findProduct(id, actorId, role);
    await this.assertShopAccess(product.shopId, actorId, role, true);

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.sku !== undefined) product.sku = dto.sku?.trim() || null;
    if (dto.price !== undefined) product.price = Number(dto.price);
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.image !== undefined) product.image = dto.image || null;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    product.updatedBy = actorId;

    await this.productRepo.save(product);
    return this.findProduct(id, actorId, role);
  }

  async addImage(id: string, imageUrl: string, actorId: string, role: string) {
    const product = await this.findProduct(id, actorId, role);
    await this.assertShopAccess(product.shopId, actorId, role, true);
    product.image = imageUrl;
    product.updatedBy = actorId;
    await this.productRepo.save(product);
    return this.findProduct(id, actorId, role);
  }

  async removeProduct(id: string, actorId: string, role: string) {
    const product = await this.findProduct(id, actorId, role);
    await this.assertShopAccess(product.shopId, actorId, role, true);
    product.isDeleted = true;
    product.isActive = false;
    product.updatedBy = actorId;
    await this.productRepo.save(product);
    return { success: true };
  }

  async createSale(dto: CreatePosSaleDto, actorId: string, role: string) {
    const shop = await this.resolvePosShop(dto.shopId, actorId, role);
    const discount = Number(dto.discount || 0);

    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(PosProduct);
      const saleRepo = manager.getRepository(PosSale);
      const itemRepo = manager.getRepository(PosSaleItem);

      const lineItems: Array<{
        product: PosProduct;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }> = [];

      for (const line of dto.items) {
        const product = await productRepo.findOne({
          where: {
            id: line.productId,
            shopId: shop.id,
            isDeleted: false,
            isActive: true,
          },
        });
        if (!product) {
          throw new BadRequestException(`Product ${line.productId} is not available`);
        }
        if (product.stock != null && product.stock < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}" (available: ${product.stock})`,
          );
        }

        const unitPrice = Number(product.price);
        const lineTotal = Number((unitPrice * line.quantity).toFixed(2));
        lineItems.push({ product, quantity: line.quantity, unitPrice, lineTotal });
      }

      const subtotal = Number(
        lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      );
      if (discount > subtotal) {
        throw new BadRequestException('Discount cannot exceed subtotal');
      }
      const total = Number((subtotal - discount).toFixed(2));

      const sale = saleRepo.create({
        receiptNumber: await this.nextReceiptNumber(shop.id, saleRepo),
        subtotal,
        discount,
        total,
        paymentMethod: dto.paymentMethod || PosPaymentMethod.CASH,
        note: dto.note?.trim() || null,
        shopId: shop.id,
        createdBy: actorId,
        isDeleted: false,
      });
      const savedSale = await saleRepo.save(sale);

      for (const line of lineItems) {
        await itemRepo.save(
          itemRepo.create({
            saleId: savedSale.id,
            productId: line.product.id,
            productName: line.product.name,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
            createdBy: actorId,
            isDeleted: false,
          }),
        );

        if (line.product.stock != null) {
          line.product.stock -= line.quantity;
          line.product.updatedBy = actorId;
          await productRepo.save(line.product);
        }
      }

      return saleRepo.findOne({
        where: { id: savedSale.id },
        relations: ['items'],
      });
    });
  }

  async listSales(query: PosSaleQueryDto, actorId: string, role: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const shopIds = await this.resolveAccessibleShopIds(query.shopId, actorId, role);

    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.isDeleted = :deleted', { deleted: false })
      .andWhere('sale.shopId IN (:...shopIds)', { shopIds });

    if (query.search) {
      qb.andWhere(
        '(sale.receiptNumber LIKE :search OR sale.note LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('sale.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findSale(id: string, actorId: string, role: string) {
    const sale = await this.saleRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['items'],
    });
    if (!sale) throw new NotFoundException('POS sale not found');
    await this.assertShopAccess(sale.shopId, actorId, role, false);
    return sale;
  }

  async todaySummary(shopId: string | undefined, actorId: string, role: string) {
    const shop = await this.resolvePosShop(shopId, actorId, role);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const row = await this.saleRepo
      .createQueryBuilder('sale')
      .select('COUNT(sale.id)', 'saleCount')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'revenue')
      .where('sale.shopId = :shopId', { shopId: shop.id })
      .andWhere('sale.isDeleted = :deleted', { deleted: false })
      .andWhere('sale.createdDate >= :start', { start })
      .getRawOne<{ saleCount: string; revenue: string }>();

    return {
      shopId: shop.id,
      saleCount: Number(row?.saleCount || 0),
      revenue: Number(row?.revenue || 0),
      date: start.toISOString().slice(0, 10),
    };
  }

  private async resolvePosShop(
    requestedShopId: string | undefined,
    actorId: string,
    role: string,
  ): Promise<Shop> {
    let shop: Shop | null = null;

    if (role === UserRole.BUSINESS_OWNER) {
      if (requestedShopId) {
        shop = await this.shopRepo.findOne({
          where: { id: requestedShopId, ownerId: actorId, isDeleted: false },
        });
      } else {
        shop = await this.shopRepo.findOne({
          where: { ownerId: actorId, isDeleted: false, posEnabled: true },
          order: { createdDate: 'ASC' },
        });
        if (!shop) {
          shop = await this.shopRepo.findOne({
            where: { ownerId: actorId, isDeleted: false },
            order: { createdDate: 'ASC' },
          });
        }
      }
    } else if (role === UserRole.ADMIN) {
      if (!requestedShopId) {
        throw new BadRequestException('shopId is required');
      }
      shop = await this.shopRepo.findOne({
        where: { id: requestedShopId, isDeleted: false },
      });
    }

    if (!shop) throw new BadRequestException('No shop available for POS');
    if (!shop.posEnabled) {
      throw new ForbiddenException(
        'Shopper POS is not enabled for this shop. Contact system admin.',
      );
    }
    return shop;
  }

  private async resolveAccessibleShopIds(
    requestedShopId: string | undefined,
    actorId: string,
    role: string,
  ): Promise<string[]> {
    if (role === UserRole.ADMIN) {
      if (requestedShopId) {
        const shop = await this.resolvePosShop(requestedShopId, actorId, role);
        return [shop.id];
      }
      const enabled = await this.shopRepo.find({
        where: { posEnabled: true, isDeleted: false },
        select: ['id'],
      });
      if (!enabled.length) {
        throw new ForbiddenException('No shops have Shopper POS enabled');
      }
      return enabled.map((s) => s.id);
    }

    const shop = await this.resolvePosShop(requestedShopId, actorId, role);
    return [shop.id];
  }

  private async assertShopAccess(
    shopId: string,
    actorId: string,
    role: string,
    requireEnabled: boolean,
  ) {
    if (role === UserRole.ADMIN) return;
    const shop = await this.shopRepo.findOne({
      where: { id: shopId, isDeleted: false },
    });
    if (!shop || shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to access this POS resource');
    }
    if (requireEnabled && !shop.posEnabled) {
      throw new ForbiddenException(
        'Shopper POS is not enabled for this shop. Contact system admin.',
      );
    }
  }

  private async nextReceiptNumber(
    shopId: string,
    saleRepo: Repository<PosSale>,
  ): Promise<string> {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `POS-${day}-`;
    const count = await saleRepo.count({
      where: { shopId },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }
}
