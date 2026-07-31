import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'List my favorites' })
  findMine(@CurrentUser('id') userId: string) {
    return this.favoritesService.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add offer to favorites' })
  add(@CurrentUser('id') userId: string, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.add(userId, dto);
  }

  @Delete(':offerId')
  @ApiOperation({ summary: 'Remove offer from favorites' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.favoritesService.remove(userId, offerId);
  }
}
