import {
  BadRequestException,
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
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import {
  RegisterShopDto,
  CreateShopDto,
  UpdateShopDto,
  UpdateShopStatusDto,
  ShopQueryDto,
} from './dto/shop.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { multerImageOptions } from '../../common/upload/multer.options';

@ApiTags('Shops')
@Controller(['shops', 'stores'])
export class ShopsController {
  constructor(
    private readonly shopsService: ShopsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved shops (public)' })
  findPublic(@Query() query: ShopQueryDto) {
    return this.shopsService.findAll(query, true);
  }

  @ApiBearerAuth('access-token')
  @Get('manage')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all shops (admin)' })
  findManage(@Query() query: ShopQueryDto) {
    return this.shopsService.findAll(query, false);
  }

  @ApiBearerAuth('access-token')
  @Get('mine')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get my shop(s)' })
  findMine(@CurrentUser('id') userId: string) {
    return this.shopsService.findMine(userId);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new shop + owner account' })
  register(@Body() dto: RegisterShopDto) {
    return this.shopsService.register(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get shop by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create shop' })
  create(
    @Body() dto: CreateShopDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.shopsService.create(dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update shop' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.shopsService.update(id, dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Post(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions('shops')))
  @ApiOperation({ summary: 'Upload shop logo to Cloudinary and save URL' })
  async uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const url = await this.cloudinary.uploadImage(file, 'shops');
    return this.shopsService.updateLogo(id, url, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve / reject / suspend shop' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.shopsService.updateStatus(id, dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Soft delete shop' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.shopsService.remove(id, actorId, role);
  }
}
