import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SelectFacebookPageDto {
  @ApiProperty({ description: 'Facebook Page id to connect' })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'One-time connect token from OAuth callback (required when selecting among pages)',
  })
  @IsOptional()
  @IsString()
  connectToken?: string;
}

export class ConfigureFacebookPageDto {
  @ApiProperty({
    description: 'Facebook Page access token for this shop (from Meta / Graph API)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  pageAccessToken: string;

  @ApiPropertyOptional({
    description: 'Optional Page id — validated against the token when provided',
  })
  @IsOptional()
  @IsString()
  pageId?: string;
}
