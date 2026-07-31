import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Offer } from '../offers/entities/offer.entity';
import { CreateFavoriteDto } from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async add(userId: string, dto: CreateFavoriteDto) {
    const offer = await this.offerRepo.findOne({
      where: { id: dto.offerId, isDeleted: false },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const existing = await this.favoriteRepo.findOne({
      where: { userId, offerId: dto.offerId, isDeleted: false },
    });
    if (existing) throw new ConflictException('Already favorited');

    const favorite = await this.favoriteRepo.save(
      this.favoriteRepo.create({
        userId,
        offerId: dto.offerId,
        createdBy: userId,
        isDeleted: false,
      }),
    );

    offer.likes += 1;
    await this.offerRepo.save(offer);
    return favorite;
  }

  async remove(userId: string, offerId: string) {
    const favorite = await this.favoriteRepo.findOne({
      where: { userId, offerId, isDeleted: false },
    });
    if (!favorite) throw new NotFoundException('Favorite not found');

    favorite.isDeleted = true;
    favorite.updatedBy = userId;
    await this.favoriteRepo.save(favorite);

    const offer = await this.offerRepo.findOne({
      where: { id: offerId, isDeleted: false },
    });
    if (offer && offer.likes > 0) {
      offer.likes -= 1;
      await this.offerRepo.save(offer);
    }

    return { success: true };
  }

  async findMine(userId: string) {
    return this.favoriteRepo.find({
      where: { userId, isDeleted: false },
      relations: ['offer', 'offer.shop', 'offer.category'],
      order: { createdDate: 'DESC' },
    });
  }
}
