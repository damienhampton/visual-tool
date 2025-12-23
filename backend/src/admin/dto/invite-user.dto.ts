import { IsEmail, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsEnum(['free', 'pro', 'team'])
  tier?: 'free' | 'pro' | 'team';

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
