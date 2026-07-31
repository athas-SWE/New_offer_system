import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(query: UserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.is_deleted = :deleted', { deleted: false });

    if (query.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.role) {
      qb.andWhere('role.name = :role', { role: query.role });
    }

    qb.orderBy('user.created_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(
      data.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
      relations: ['role'],
    });
  }

  async create(dto: CreateUserDto, actorId: string) {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const roleName = (dto.roleName as UserRole) || UserRole.CUSTOMER;
    const role = await this.roleRepo.findOne({
      where: { name: roleName, isDeleted: false },
    });
    if (!role) throw new BadRequestException('Role not found');

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      phone: dto.phone || null,
      roleId: role.id,
      createdBy: actorId,
      isDeleted: false,
    });
    const saved = await this.userRepo.save(user);
    return this.sanitize(await this.findEntity(saved.id));
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.findEntity(id);
    Object.assign(user, {
      ...dto,
      updatedBy: actorId,
    });
    await this.userRepo.save(user);
    return this.sanitize(await this.findEntity(id));
  }

  async remove(id: string, actorId: string) {
    const user = await this.findEntity(id);
    user.isDeleted = true;
    user.updatedBy = actorId;
    await this.userRepo.save(user);
    return { success: true };
  }

  private async findEntity(id: string) {
    const user = await this.userRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      role: user.role?.name,
      createdDate: user.createdDate,
    };
  }
}
