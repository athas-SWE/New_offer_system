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
import { PosService } from './pos.service';
import {
  CreatePosProductDto,
  UpdatePosProductDto,
  PosProductQueryDto,
  CreatePosSaleDto,
  PosSaleQueryDto,
} from './dto/pos.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { multerImageOptions } from '../../common/upload/multer.options';

@ApiTags('POS')
@ApiBearerAuth('access-token')
@Controller('pos')
@Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get('summary/today')
  @ApiOperation({ summary: 'Today POS sales summary for a shop' })
  todaySummary(
    @Query('shopId') shopId: string | undefined,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.todaySummary(shopId, actorId, role);
  }

  @Get('products')
  @ApiOperation({ summary: 'List POS products' })
  listProducts(
    @Query() query: PosProductQueryDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.listProducts(query, actorId, role);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create POS product' })
  createProduct(
    @Body() dto: CreatePosProductDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.createProduct(dto, actorId, role);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get POS product' })
  getProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.findProduct(id, actorId, role);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update POS product' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosProductDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.updateProduct(id, dto, actorId, role);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Soft delete POS product' })
  removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.removeProduct(id, actorId, role);
  }

  @Post('products/:id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions('pos')))
  @ApiOperation({ summary: 'Upload POS product image to Cloudinary' })
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const url = await this.cloudinary.uploadImage(file, 'pos');
    return this.posService.addImage(id, url, actorId, role);
  }

  @Get('sales')
  @ApiOperation({ summary: 'List POS sales' })
  listSales(
    @Query() query: PosSaleQueryDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.listSales(query, actorId, role);
  }

  @Post('sales')
  @ApiOperation({ summary: 'Checkout / create POS sale' })
  createSale(
    @Body() dto: CreatePosSaleDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.createSale(dto, actorId, role);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Get POS sale with items' })
  getSale(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.posService.findSale(id, actorId, role);
  }
}
