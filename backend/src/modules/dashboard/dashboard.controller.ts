import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get role-based dashboard metrics' })
  getDashboard(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.dashboardService.getDashboard(userId, role);
  }
}
