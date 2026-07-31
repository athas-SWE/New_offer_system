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
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../../common/enums/role.enum';
import { BusinessStatus } from '../../common/enums/business-status.enum';
import {
  RegisterBusinessDto,
  UpdateBusinessDto,
  UpdateBusinessStatusDto,
  BusinessQueryDto,
} from './dto/business.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterBusinessDto) {
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

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        name: dto.ownerName,
        email: dto.ownerEmail.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.ownerPassword, 12),
        phone: dto.ownerPhone || null,
        roleId: role.id,
        isDeleted: false,
      });
      const savedUser = await manager.save(user);

      const business = manager.create(Business, {
        name: dto.name,
        description: dto.description || null,
        registrationNumber: dto.registrationNumber || null,
        email: dto.email || dto.ownerEmail.toLowerCase(),
        phone: dto.phone || dto.ownerPhone || null,
        address: dto.address || null,
        cityId: dto.cityId || null,
        ownerId: savedUser.id,
        status: BusinessStatus.PENDING,
        createdBy: savedUser.id,
        isDeleted: false,
      });
      const savedBusiness = await manager.save(business);
      return this.findOne(savedBusiness.id);
    });
  }

  async findAll(query: BusinessQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.businessRepo
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect('business.city', 'city')
      .where('business.is_deleted = :deleted', { deleted: false });

    if (query.search) {
      qb.andWhere('business.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.status) {
      qb.andWhere('business.status = :status', { status: query.status });
    }

    qb.orderBy('business.created_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const business = await this.businessRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['owner', 'city', 'stores'],
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findMine(ownerId: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerId, isDeleted: false },
      relations: ['city', 'stores'],
    });
    if (!business) throw new NotFoundException('Business not found for this user');
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto, actorId: string, role: string) {
    const business = await this.findOne(id);
    if (role !== UserRole.ADMIN && business.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to update this business');
    }
    Object.assign(business, { ...dto, updatedBy: actorId });
    await this.businessRepo.save(business);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateBusinessStatusDto, actorId: string) {
    const business = await this.findOne(id);
    business.status = dto.status;
    business.updatedBy = actorId;
    await this.businessRepo.save(business);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const business = await this.findOne(id);
    business.isDeleted = true;
    business.updatedBy = actorId;
    await this.businessRepo.save(business);
    return { success: true };
  }
}
