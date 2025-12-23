import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';

@Injectable()
export class ActivityTrackerMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verify and decode the token
        const payload = this.jwtService.verify(token);
        
        if (payload && payload.sub) {
          // Update lastActiveAt asynchronously without blocking the request
          this.userRepository
            .update(payload.sub, { lastActiveAt: new Date() })
            .catch((error) => {
              // Log error but don't fail the request
              console.error('Failed to update user activity:', error);
            });
        }
      }
    } catch (error) {
      // Ignore JWT verification errors - just don't update activity
      // The actual auth guard will handle authentication
    }
    
    next();
  }
}
