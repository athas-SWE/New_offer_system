import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HeroSlidesService } from './hero-slides.service';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Hero Slides')
@Controller('hero-slides')
export class HeroSlidesController {
  constructor(private readonly heroSlidesService: HeroSlidesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active home hero slides (public slideshow)' })
  findActive() {
    return this.heroSlidesService.findActive();
  }

  @ApiBearerAuth('access-token')
  @Get('manage')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all hero slides (admin)' })
  findAll() {
    return this.heroSlidesService.findAll();
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create hero slide' })
  create(
    @Body() dto: CreateHeroSlideDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.heroSlidesService.create(dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update hero slide' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHeroSlideDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.heroSlidesService.update(id, dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete hero slide' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.heroSlidesService.remove(id, actorId);
  }
}
