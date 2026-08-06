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
import { RentalsService } from './rentals.service';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto } from './dto/rental.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { multerImageOptions } from '../../common/upload/multer.options';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalsController {
  constructor(
    private readonly rentalsService: RentalsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active rentals (public)' })
  findAllPublic(@Query() query: RentalQueryDto) {
    return this.rentalsService.findAll(query, true);
  }

  @ApiBearerAuth('access-token')
  @Get('manage')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'List rentals for management' })
  findAllManage(
    @Query() query: RentalQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.rentalsService.findAll(query, false, { id: userId, role });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get rental by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalsService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create rental listing' })
  create(
    @Body() dto: CreateRentalDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.rentalsService.create(dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update rental listing' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRentalDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.rentalsService.update(id, dto, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Soft delete rental listing' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.rentalsService.remove(id, actorId, role);
  }

  @ApiBearerAuth('access-token')
  @Post(':id/image')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions('rentals')))
  @ApiOperation({ summary: 'Upload rental image to Cloudinary' })
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const url = await this.cloudinary.uploadImage(file, 'rentals');
    return this.rentalsService.addImage(id, url, actorId, role);
  }
}
