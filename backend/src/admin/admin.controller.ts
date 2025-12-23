import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/revenue-chart')
  async getRevenueChart(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.adminService.getRevenueChart(daysNum);
  }

  @Get('dashboard/user-growth-chart')
  async getUserGrowthChart(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.adminService.getUserGrowthChart(daysNum);
  }

  @Get('dashboard/top-users')
  async getTopUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getTopUsers(limitNum);
  }

  @Get('dashboard/recent-signups')
  async getRecentSignups(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getRecentSignups(limitNum);
  }

  @Get('dashboard/recent-upgrades')
  async getRecentUpgrades(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getRecentUpgrades(limitNum);
  }

  @Get('dashboard/active-users-chart')
  async getActiveUsersChart(@Query('hours') hours?: string) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.adminService.getActiveUsersChart(hoursNum);
  }

  @Get('dashboard/currently-active')
  async getCurrentlyActiveUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getCurrentlyActiveUsers(limitNum);
  }

  @Get('dashboard/recently-active')
  async getRecentlyActiveUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getRecentlyActiveUsers(limitNum);
  }

  @Get('users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.listUsers(pageNum, limitNum, search, filter);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() data: { name?: string; email?: string; isAdmin?: boolean },
    @Request() req,
  ) {
    const result = await this.adminService.updateUser(id, data);
    await this.auditLogService.log(
      req.user.id,
      'UPDATE_USER',
      'user',
      id,
      { changes: data },
    );
    return result;
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    const result = await this.adminService.deleteUser(id);
    await this.auditLogService.log(
      req.user.id,
      'DELETE_USER',
      'user',
      id,
    );
    return result;
  }

  @Post('users/:id/subscription-override')
  async manualSubscriptionOverride(
    @Param('id') id: string,
    @Body() data: { tier: 'free' | 'pro' | 'team' },
    @Request() req,
  ) {
    const result = await this.adminService.manualSubscriptionOverride(id, data.tier);
    await this.auditLogService.log(
      req.user.id,
      'SUBSCRIPTION_OVERRIDE',
      'subscription',
      id,
      { tier: data.tier },
    );
    return result;
  }

  @Get('subscriptions')
  async listSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.listSubscriptions(pageNum, limitNum, filter);
  }

  @Get('subscriptions/:id')
  async getSubscriptionDetails(@Param('id') id: string) {
    return this.adminService.getSubscriptionDetails(id);
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') id: string, @Request() req) {
    const result = await this.adminService.cancelSubscription(id);
    await this.auditLogService.log(
      req.user.id,
      'CANCEL_SUBSCRIPTION',
      'subscription',
      id,
    );
    return result;
  }

  @Get('diagrams')
  async listDiagrams(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.listDiagrams(pageNum, limitNum, search);
  }

  @Get('diagrams/:id')
  async getDiagramDetails(@Param('id') id: string) {
    return this.adminService.getDiagramDetails(id);
  }

  @Delete('diagrams/:id')
  async deleteDiagram(@Param('id') id: string, @Request() req) {
    const result = await this.adminService.deleteDiagram(id);
    await this.auditLogService.log(
      req.user.id,
      'DELETE_DIAGRAM',
      'diagram',
      id,
    );
    return result;
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditLogService.getAuditLogs(
      pageNum,
      limitNum,
      adminId,
      action,
      targetType,
    );
  }

  @Post('users/invite')
  async inviteUser(@Body() inviteUserDto: any, @Request() req) {
    const result = await this.adminService.inviteUser(inviteUserDto, req.user.name);
    await this.auditLogService.log(
      req.user.id,
      'INVITE_USER',
      'user',
      result.user.id,
      { email: inviteUserDto.email, tier: inviteUserDto.tier },
    );
    return result;
  }
}
