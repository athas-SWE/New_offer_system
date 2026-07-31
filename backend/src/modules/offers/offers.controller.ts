import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto, OfferQueryDto } from './dto/offer.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active offers (public)' })
  findAllPublic(@Query() query: OfferQueryDto) {
    return this.offersService.findAll(query, true);
  }

  @ApiBearerAuth('access-token')
  @Get('manage')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'List all offers for management' })
  findAllManage(@Query() query: OfferQueryDto) {
    return this.offersService.findAll(query, false);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get offer by id and increment views' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.offersService.incrementView(id, userId);
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create offer' })
  create(
    @Body() dto: CreateOfferDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.create(dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update offer' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.update(id, dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Soft delete offer' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.remove(id, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Post(':id/images')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/offers',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload offer image' })
  uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    const url = `/uploads/offers/${file.filename}`;
    return this.offersService.addImage(id, url, actorId, role);
  }
}
