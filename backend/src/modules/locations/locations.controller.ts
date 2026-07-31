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
import { LocationsService } from './locations.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CreateDistrictDto,
  UpdateDistrictDto,
} from './dto/location.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get('districts')
  @ApiOperation({ summary: 'List districts' })
  findDistricts() {
    return this.locationsService.findDistricts();
  }

  @Public()
  @Get('districts/:id')
  findDistrict(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findDistrict(id);
  }

  @ApiBearerAuth('access-token')
  @Post('districts')
  @Roles(UserRole.ADMIN)
  createDistrict(
    @Body() dto: CreateDistrictDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.locationsService.createDistrict(dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Put('districts/:id')
  @Roles(UserRole.ADMIN)
  updateDistrict(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDistrictDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.locationsService.updateDistrict(id, dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Delete('districts/:id')
  @Roles(UserRole.ADMIN)
  removeDistrict(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.locationsService.removeDistrict(id, actorId);
  }

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'List cities' })
  findCities(@Query('districtId') districtId?: string) {
    return this.locationsService.findCities(districtId);
  }

  @Public()
  @Get('cities/:id')
  findCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findCity(id);
  }

  @ApiBearerAuth('access-token')
  @Post('cities')
  @Roles(UserRole.ADMIN)
  createCity(@Body() dto: CreateCityDto, @CurrentUser('id') actorId: string) {
    return this.locationsService.createCity(dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Put('cities/:id')
  @Roles(UserRole.ADMIN)
  updateCity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.locationsService.updateCity(id, dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Delete('cities/:id')
  @Roles(UserRole.ADMIN)
  removeCity(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.locationsService.removeCity(id, actorId);
  }
}
