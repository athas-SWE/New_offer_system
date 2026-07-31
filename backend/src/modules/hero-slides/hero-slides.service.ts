import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSlide } from './entities/hero-slide.entity';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';

@Injectable()
export class HeroSlidesService {
  constructor(
    @InjectRepository(HeroSlide)
    private readonly slideRepo: Repository<HeroSlide>,
  ) {}

  findActive() {
    return this.slideRepo.find({
      where: { isDeleted: false, isActive: true },
      order: { sortOrder: 'ASC', createdDate: 'DESC' },
    });
  }

  findAll() {
    return this.slideRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', createdDate: 'DESC' },
    });
  }

  async findOne(id: string) {
    const slide = await this.slideRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!slide) throw new NotFoundException('Hero slide not found');
    return slide;
  }

  async create(dto: CreateHeroSlideDto, actorId: string) {
    const slide = this.slideRepo.create({
      title: dto.title,
      subtitle: dto.subtitle || null,
      imageUrl: dto.imageUrl,
      ctaLabel: dto.ctaLabel || 'Browse offers',
      ctaLink: dto.ctaLink || '/offers',
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      isDeleted: false,
    });
    return this.slideRepo.save(slide);
  }

  async update(id: string, dto: UpdateHeroSlideDto, actorId: string) {
    const slide = await this.findOne(id);
    if (dto.title !== undefined) slide.title = dto.title;
    if (dto.subtitle !== undefined) slide.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) slide.imageUrl = dto.imageUrl;
    if (dto.ctaLabel !== undefined) slide.ctaLabel = dto.ctaLabel;
    if (dto.ctaLink !== undefined) slide.ctaLink = dto.ctaLink;
    if (dto.sortOrder !== undefined) slide.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) slide.isActive = dto.isActive;
    slide.updatedBy = actorId;
    return this.slideRepo.save(slide);
  }

  async remove(id: string, actorId: string) {
    const slide = await this.findOne(id);
    slide.isDeleted = true;
    slide.isActive = false;
    slide.updatedBy = actorId;
    await this.slideRepo.save(slide);
    return { success: true };
  }
}
