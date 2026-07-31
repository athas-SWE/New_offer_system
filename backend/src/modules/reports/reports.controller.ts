import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get offers report (JSON)' })
  getReport(@Query('businessId') businessId?: string) {
    return this.reportsService.getOffersReport(businessId);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Platform summary report' })
  getSummary() {
    return this.reportsService.getSummaryReport();
  }

  @Get('export/excel')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Export offers report as Excel' })
  async exportExcel(
    @Res() res: Response,
    @Query('businessId') businessId?: string,
  ) {
    const buffer = await this.reportsService.exportOffersExcel(businessId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=offers-report.xlsx',
    );
    res.send(buffer);
  }

  @Get('export/pdf')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export summary report as PDF' })
  async exportPdf(@Res() res: Response) {
    const buffer = await this.reportsService.exportSummaryPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=summary-report.pdf',
    );
    res.send(buffer);
  }
}
