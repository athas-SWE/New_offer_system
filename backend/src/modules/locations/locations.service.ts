import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { District } from './entities/district.entity';
import {
  CreateCityDto,
  UpdateCityDto,
  CreateDistrictDto,
  UpdateDistrictDto,
} from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
  ) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Districts
  async createDistrict(dto: CreateDistrictDto, actorId: string) {
    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.districtRepo.findOne({
      where: { slug, isDeleted: false },
    });
    if (existing) throw new ConflictException('District slug already exists');

    return this.districtRepo.save(
      this.districtRepo.create({
        name: dto.name,
        slug,
        province: dto.province || null,
        isActive: true,
        createdBy: actorId,
        isDeleted: false,
      }),
    );
  }

  async findDistricts() {
    return this.districtRepo.find({
      where: { isDeleted: false },
      relations: ['cities'],
      order: { name: 'ASC' },
    });
  }

  async findDistrict(id: string) {
    const district = await this.districtRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['cities'],
    });
    if (!district) throw new NotFoundException('District not found');
    return district;
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto, actorId: string) {
    const district = await this.findDistrict(id);
    Object.assign(district, { ...dto, updatedBy: actorId });
    await this.districtRepo.save(district);
    return this.findDistrict(id);
  }

  async removeDistrict(id: string, actorId: string) {
    const district = await this.findDistrict(id);
    district.isDeleted = true;
    district.updatedBy = actorId;
    await this.districtRepo.save(district);
    return { success: true };
  }

  // Cities
  async createCity(dto: CreateCityDto, actorId: string) {
    await this.findDistrict(dto.districtId);
    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.cityRepo.findOne({
      where: { slug, isDeleted: false },
    });
    if (existing) throw new ConflictException('City slug already exists');

    return this.cityRepo.save(
      this.cityRepo.create({
        name: dto.name,
        slug,
        districtId: dto.districtId,
        isActive: true,
        createdBy: actorId,
        isDeleted: false,
      }),
    );
  }

  async findCities(districtId?: string) {
    const where: Record<string, unknown> = { isDeleted: false };
    if (districtId) where.districtId = districtId;
    return this.cityRepo.find({
      where,
      relations: ['district'],
      order: { name: 'ASC' },
    });
  }

  async findCity(id: string) {
    const city = await this.cityRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['district'],
    });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async updateCity(id: string, dto: UpdateCityDto, actorId: string) {
    const city = await this.findCity(id);
    Object.assign(city, { ...dto, updatedBy: actorId });
    await this.cityRepo.save(city);
    return this.findCity(id);
  }

  async removeCity(id: string, actorId: string) {
    const city = await this.findCity(id);
    city.isDeleted = true;
    city.updatedBy = actorId;
    await this.cityRepo.save(city);
    return { success: true };
  }
}
