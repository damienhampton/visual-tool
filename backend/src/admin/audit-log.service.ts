import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    adminId: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, any>,
  ) {
    const auditLog = this.auditLogRepository.create({
      adminId,
      action,
      targetType,
      targetId,
      metadata,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    adminId?: string,
    action?: string,
    targetType?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.admin', 'admin');

    if (adminId) {
      queryBuilder.andWhere('audit_log.adminId = :adminId', { adminId });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (targetType) {
      queryBuilder.andWhere('audit_log.targetType = :targetType', { targetType });
    }

    const [logs, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('audit_log.createdAt', 'DESC')
      .getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
