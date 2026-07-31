import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create category' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser('id') actorId: string) {
    return this.categoriesService.create(dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.categoriesService.update(id, dto, actorId);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete category' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.categoriesService.remove(id, actorId);
  }
}
