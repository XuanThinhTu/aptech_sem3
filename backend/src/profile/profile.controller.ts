import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

// Keep multer typed loosely here to avoid adding extra dev dependencies for the demo project.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { diskStorage } = require('multer');

const uploadRoot = join(process.cwd(), 'uploads', 'profile');
if (!existsSync(uploadRoot)) {
  mkdirSync(uploadRoot, { recursive: true });
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('friend/view')
  getFriendProfile(
    @Query('viewerUserId') viewerUserId: string,
    @Query('friendUserId') friendUserId: string,
  ) {
    return this.profileService.getFriendProfile(viewerUserId, friendUserId);
  }

  @Get(':userId')
  getProfile(@Param('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Put(':userId/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: uploadRoot,
        filename: (_req: any, file: any, callback: any) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req: any, file: any, callback: any) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed.'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  updateAvatar(
    @Param('userId') userId: string,
    @UploadedFile() avatarFile?: { path?: string },
  ) {
    return this.profileService.updateAvatar(userId, avatarFile);
  }

  @Put(':userId')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: uploadRoot,
        filename: (_req: any, file: any, callback: any) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req: any, file: any, callback: any) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed.'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  updateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatarFile?: { path?: string },
  ) {
    return this.profileService.updateProfile(userId, dto, avatarFile);
  }
}
