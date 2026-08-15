import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HeroSlidesService } from './hero-slides.service';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { multerImageOptions } from '../../common/upload/multer.options';

@ApiTags('Hero Slides')
@Controller('hero-slides')
export class HeroSlidesController {
  constructor(
    private readonly heroSlidesService: HeroSlidesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'file'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        ctaLabel: { type: 'string' },
        ctaLink: { type: 'string' },
        sortOrder: { type: 'integer' },
        isActive: { type: 'boolean' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions('hero')))
  @ApiOperation({ summary: 'Create hero slide (upload image to Cloudinary)' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateHeroSlideDto,
    @CurrentUser('id') actorId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const imageUrl = await this.cloudinary.uploadImage(file, 'hero');
    return this.heroSlidesService.create({ ...dto, imageUrl }, actorId);
  }

  @ApiBearerAuth('access-token')
  @Post(':id/image')
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions('hero')))
  @ApiOperation({ summary: 'Replace hero slide image (Cloudinary)' })
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const imageUrl = await this.cloudinary.uploadImage(file, 'hero');
    return this.heroSlidesService.update(id, { imageUrl }, actorId);
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
