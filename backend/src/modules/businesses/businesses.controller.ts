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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import {
  RegisterBusinessDto,
  UpdateBusinessDto,
  UpdateBusinessStatusDto,
  BusinessQueryDto,
} from './dto/business.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new business + owner account' })
  register(@Body() dto: RegisterBusinessDto) {
    return this.businessesService.register(dto);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List businesses (admin)' })
  findAll(@Query() query: BusinessQueryDto) {
    return this.businessesService.findAll(query);
  }

  @ApiBearerAuth()
  @Get('mine')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get my business' })
  findMine(@CurrentUser('id') userId: string) {
    return this.businessesService.findMine(userId);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get business by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.findOne(id);
  }

  @ApiBearerAuth()
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update business' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.businessesService.update(id, dto, actorId, role);
  }

  @ApiBearerAuth()
  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve / reject / suspend business' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.businessesService.updateStatus(id, dto, actorId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete business' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.businessesService.remove(id, actorId);
  }
}
