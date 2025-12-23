import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class ActivityTrackerMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if user is authenticated (added by JWT guard)
    const user = req['user'] as any;
    if (user && user.sub) {
      const userId = user.sub;
      
      // Update lastActiveAt asynchronously without blocking the request
      this.userRepository
        .update(userId, { lastActiveAt: new Date() })
        .catch((error) => {
          // Log error but don't fail the request
          console.error('Failed to update user activity:', error);
        });
    }
    
    next();
  }
}
