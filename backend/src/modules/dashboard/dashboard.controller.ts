import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
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

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('admin/offers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin recent offers list' })
  getAdminRecentOffers() {
    return this.dashboardService.getAdminRecentOffers();
  }

  @Get('business')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Business owner dashboard stats' })
  getBusinessDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getBusinessDashboard(userId);
  }

  @Get('business/offers')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Business owner offers list' })
  getBusinessOffers(@CurrentUser('id') userId: string) {
    return this.dashboardService.getBusinessOffers(userId);
  }

  @Get('customer')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Shopper / customer dashboard' })
  getCustomerDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getCustomerDashboard(userId);
  }
}
