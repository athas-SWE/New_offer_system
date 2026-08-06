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
  Res,
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
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ShopsService } from './shops.service';
import {
  RegisterShopDto,
  CreateShopDto,
  UpdateShopDto,
  UpdateShopStatusDto,
  UpdateShopPosDto,
  ShopQueryDto,
} from './dto/shop.dto';
import {
  ConfigureFacebookPageDto,
  SelectFacebookPageDto,
} from '../facebook/dto/facebook.dto';
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
    private readonly config: ConfigService,
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

  @ApiBearerAuth('access-token')
  @Get('me/facebook/auth-url')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get Facebook OAuth URL to connect a Page' })
  async facebookAuthUrl(@CurrentUser('id') userId: string) {
    const shop = await this.shopsService.getOwnedPrimaryShop(userId);
    return this.shopsService.getFacebookAuthUrl(userId, shop.id);
  }

  @ApiBearerAuth('access-token')
  @Get('me/facebook/status')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Facebook Page connection status for my shop' })
  async facebookStatus(@CurrentUser('id') userId: string) {
    const shop = await this.shopsService.getOwnedPrimaryShop(userId);
    return this.shopsService.getFacebookStatus(shop);
  }

  @ApiBearerAuth('access-token')
  @Get('me/facebook/pending-pages')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List Pages available after OAuth (multi-page)' })
  facebookPendingPages(
    @CurrentUser('id') userId: string,
    @Query('connectToken') connectToken: string,
  ) {
    if (!connectToken) {
      throw new BadRequestException('connectToken is required');
    }
    return this.shopsService.listFacebookPendingPages(connectToken, userId);
  }

  @ApiBearerAuth('access-token')
  @Post('me/facebook/configure')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Configure this shop’s own Facebook Page access token',
  })
  configureFacebookPage(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ConfigureFacebookPageDto,
  ) {
    return this.shopsService.configureFacebookPage(
      userId,
      role,
      dto.pageAccessToken,
      dto.pageId,
    );
  }

  @ApiBearerAuth('access-token')
  @Post('me/facebook/select-page')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Select which Facebook Page to connect (OAuth)' })
  selectFacebookPage(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: SelectFacebookPageDto,
  ) {
    return this.shopsService.selectFacebookPage(
      userId,
      role,
      dto.pageId,
      dto.connectToken,
    );
  }

  @ApiBearerAuth('access-token')
  @Delete('me/facebook')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect Facebook Page from my shop' })
  disconnectFacebook(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.shopsService.disconnectFacebook(userId, role);
  }

  @Public()
  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth callback (redirects to business dashboard)' })
  async facebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const site = (
      this.config.get<string>('PUBLIC_SITE_URL') ||
      this.config.get<string>('CORS_ORIGIN') ||
      'http://localhost:4200'
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    if (error) {
      const msg = encodeURIComponent(errorDescription || error || 'Facebook auth failed');
      return res.redirect(`${site}/business?facebook=error&message=${msg}`);
    }
    if (!code || !state) {
      return res.redirect(
        `${site}/business?facebook=error&message=${encodeURIComponent('Missing OAuth code')}`,
      );
    }
    try {
      const result = await this.shopsService.handleFacebookCallback(code, state);
      return res.redirect(`${site}${result.redirectPath}`);
    } catch (err) {
      const msg = encodeURIComponent(
        err instanceof Error ? err.message : 'Facebook connect failed',
      );
      return res.redirect(`${site}/business?facebook=error&message=${msg}`);
    }
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
  @Put(':id/pos')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable or disable Shopper POS upgrade for a shop' })
  updatePosAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopPosDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.shopsService.updatePosAccess(id, dto.posEnabled, actorId);
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
