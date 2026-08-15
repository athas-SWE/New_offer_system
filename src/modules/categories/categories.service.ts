import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateCategoryDto, actorId: string) {
    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.categoryRepo.findOne({
      where: { slug, isDeleted: false },
    });
    if (existing) throw new ConflictException('Category slug already exists');

    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      iconUrl: dto.iconUrl || null,
      sortOrder: dto.sortOrder ?? 0,
      parentId: dto.parentId || null,
      isActive: true,
      createdBy: actorId,
      isDeleted: false,
    });
    return this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      where: { isDeleted: false },
      relations: ['children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['children', 'parent'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, actorId: string) {
    const category = await this.findOne(id);
    if (dto.slug) {
      const clash = await this.categoryRepo.findOne({
        where: { slug: dto.slug, isDeleted: false },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
    }
    Object.assign(category, { ...dto, updatedBy: actorId });
    await this.categoryRepo.save(category);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const category = await this.findOne(id);
    category.isDeleted = true;
    category.updatedBy = actorId;
    await this.categoryRepo.save(category);
    return { success: true };
  }
}
