import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DashboardService } from './dashboard.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { diskStorage } = require('multer');

const serviceUploadRoot = join(process.cwd(), 'uploads', 'services');
if (!existsSync(serviceUploadRoot)) {
  mkdirSync(serviceUploadRoot, { recursive: true });
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('accounts')
  getAccounts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.dashboardService.getAccounts({
      page,
      pageSize,
      search,
      role,
    });
  }

  @Post('accounts/admin')
  createAdminAccount(@Body() dto: CreateAdminAccountDto) {
    return this.dashboardService.createAdminAccount(dto);
  }

  @Get('services')
  getServices(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.dashboardService.getServiceCatalog({
      page,
      pageSize,
      search,
    });
  }

  @Post('services')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: serviceUploadRoot,
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
  createService(
    @Body() dto: CreateServiceDto,
    @UploadedFile() imageFile?: { path?: string },
  ) {
    return this.dashboardService.createService(dto, imageFile);
  }

  @Put('services/:serviceId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: serviceUploadRoot,
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
  updateService(
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
    @UploadedFile() imageFile?: { path?: string },
  ) {
    return this.dashboardService.updateService(serviceId, dto, imageFile);
  }

  @Delete('services/:serviceId')
  deleteService(
    @Param('serviceId') serviceId: string,
    @Query('actorUserId') actorUserId: string,
  ) {
    return this.dashboardService.deleteService(serviceId, actorUserId);
  }

  @Get('orders')
  getOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.dashboardService.getOrders({
      page,
      pageSize,
      search,
      status,
    });
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: { actorUserId: string; status: string },
  ) {
    return this.dashboardService.updateOrderStatus(orderId, dto.actorUserId, dto.status);
  }

  @Get('services/list-for-broadcast')
  getServicesForSelect() {
    return this.dashboardService.getRealServicesForSelect();
  }

  @Post('services/broadcast')
  createBroadcastContent(
    // @Body() dto: { 
    //   serviceType: string; 
    //   title: string; 
    //   content: string; 
    //   scheduledTime: string 
    // },
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.dashboardService.createBroadcastContent(dto);
  }

  @Get('services/broadcast-history') 
  getBroadcastHistory(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.dashboardService.getBroadcastHistory({ page, pageSize });
  }
}