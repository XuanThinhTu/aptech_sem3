import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { Model, PipelineStage, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { join, normalize } from 'path';
import {
  OrderStatus,
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
} from '../database/enums/database.enums';
import { ContentService } from '../database/schemas/content-service.schema';
import { Payment } from '../database/schemas/payment.schema';
import { ServiceSubscription } from '../database/schemas/service-subscription.schema';
import { User } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceContent, ServiceContentDocument } from 'src/database/schemas/service-content.schema';
import { InternalServerErrorException } from '@nestjs/common';
import { Message } from '../database/schemas/message.schema';
type DailyRevenueAggregate = {
  _id: string;
  revenue: number;
  orderCount: number;
};

type AccountListQuery = {
  page?: string;
  pageSize?: string;
  search?: string;
  role?: string;
};

type ServiceListQuery = {
  page?: string;
  pageSize?: string;
  search?: string;
};

type OrderListQuery = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
};

type ServiceCatalogItem = {
  _id: Types.ObjectId;
  key: string;
  name: string;
  description: string;
  imageUrl: string;
  monthlyPrice: number;
  isActive: boolean;
  createdAt?: Date;
};

type OrderListItem = {
  _id: Types.ObjectId;
  txnRef: string;
  amount: number;
  createdAt?: Date;
  paidAt?: Date;
  orderStatus?: string;
  paymentStatus: string;
  accountName: string;
  mobileNumber: string;
  serviceNames: string[];
};

@Injectable()
export class DashboardService {
  private readonly backendBaseUrl: string;
  private readonly uploadsRoot = join(process.cwd(), 'uploads');
  private readonly servicesUploadsRoot = join(this.uploadsRoot, 'services');
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';

  constructor(
    private readonly configService: ConfigService,
    private readonly friendsRealtimeService: FriendsRealtimeService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(ContentService.name)
    private readonly contentServiceModel: Model<ContentService>,
    @InjectModel(ServiceSubscription.name)
    private readonly serviceSubscriptionModel: Model<ServiceSubscription>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,  
    @InjectModel(ServiceContent.name)
    private readonly serviceContentModel: Model<ServiceContentDocument>,
    @InjectModel('Message') private readonly messageModel: Model<any>, 
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';

    if (!existsSync(this.servicesUploadsRoot)) {
      mkdirSync(this.servicesUploadsRoot, { recursive: true });
    }
  }

  async getOverview() {
    const onlineUsers = FriendsRealtimeService.countOnlineUsers();
    const visiblePaymentFilter = this.buildVisiblePaymentFilter();

    const [
      totalAccounts,
      activeServices,
      totalServices,
      totalSubscriptions,
      activeSubscriptions,
      totalOrders,
      pendingOrders,
      successOrders,
      failedOrders,
      cancelledOrders,
      totalRevenueResult,
      revenueByDay,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.contentServiceModel.countDocuments({ isActive: true }),
      this.contentServiceModel.countDocuments(),
      this.serviceSubscriptionModel.countDocuments(),
      this.serviceSubscriptionModel.countDocuments({
        status: SubscriptionStatus.ACTIVE,
      }),
      this.paymentModel.countDocuments(visiblePaymentFilter),
      this.paymentModel.countDocuments({
        ...visiblePaymentFilter,
        status: PaymentStatus.PENDING,
      }),
      this.paymentModel.countDocuments({
        ...visiblePaymentFilter,
        status: PaymentStatus.SUCCESS,
      }),
      this.paymentModel.countDocuments({
        ...visiblePaymentFilter,
        status: PaymentStatus.FAILED,
      }),
      this.paymentModel.countDocuments({
        ...visiblePaymentFilter,
        status: PaymentStatus.CANCELLED,
      }),
      this.paymentModel.aggregate<{ totalRevenue: number }>([
        { $match: { ...visiblePaymentFilter, status: PaymentStatus.SUCCESS } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),
      this.getDailyRevenueForLastSevenDays(),
    ]);

    const offlineUsers = Math.max(0, totalAccounts - onlineUsers);
    const inactiveServices = Math.max(0, totalServices - activeServices);
    const serviceActiveRate = totalServices
      ? Number(((activeServices / totalServices) * 100).toFixed(1))
      : 0;
    const subscriptionActiveRate = totalSubscriptions
      ? Number(((activeSubscriptions / totalSubscriptions) * 100).toFixed(1))
      : 0;

    return {
      accounts: {
        total: totalAccounts,
        online: onlineUsers,
        offline: offlineUsers,
        onlineRate: totalAccounts
          ? Number(((onlineUsers / totalAccounts) * 100).toFixed(1))
          : 0,
      },
      services: {
        active: activeServices,
        inactive: inactiveServices,
        total: totalServices,
        activeRate: serviceActiveRate,
        totalSubscriptions,
        activeSubscriptions,
        subscriptionActiveRate,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        approved: successOrders,
        completed: successOrders,
        cancelled: cancelledOrders,
        failed: failedOrders,
        totalRevenue: totalRevenueResult[0]?.totalRevenue ?? 0,
        revenueLast7Days: revenueByDay,
      },
    };
  }

  async createAdminAccount(dto: CreateAdminAccountDto) {
    const actor = await this.userModel.findById(dto.actorUserId);
    if (!actor || actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only the superadmin can create admin accounts.');
    }

    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const mobileNumber = dto.mobileNumber.trim();

    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }, { mobileNumber }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new BadRequestException('This username has already been registered.');
      }

      if (existingUser.email === email) {
        throw new BadRequestException('This email has already been registered.');
      }

      throw new BadRequestException('THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY');
    }

    const passwordHash = await bcrypt.hash('1234567890', 10);

    const createdAdmin = await this.userModel.create({
      username,
      passwordHash,
      email,
      mobileNumber,
      mobileVerified: true,
      emailVerified: true,
      isActive: true,
      role: UserRole.ADMIN,
    });

    this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');

    return {
      message: 'Admin account created successfully. Default password is 1234567890.',
      account: {
        id: String(createdAdmin._id),
        username: createdAdmin.username,
        email: createdAdmin.email,
        mobileNumber: createdAdmin.mobileNumber,
        role: createdAdmin.role,
        avatarUrl: this.toPublicAssetUrl(this.defaultAvatarPath),
      },
    };
  }

  async getServiceCatalog(query: ServiceListQuery) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10),
    );
    const search = query.search?.trim() ?? '';
    const skip = (page - 1) * pageSize;

    const filter = search
      ? {
          name: {
            $regex: this.escapeRegex(search),
            $options: 'i',
          },
        }
      : {};

    const [totalItems, items] = await Promise.all([
      this.contentServiceModel.countDocuments(filter),
      this.contentServiceModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<ServiceCatalogItem[]>(),
    ]);

    return {
      items: items.map((item) => ({
        id: String(item._id),
        key: item.key,
        name: item.name,
        description: item.description,
        imageUrl: this.toPublicAssetUrl(item.imageUrl ?? this.defaultAvatarPath),
        monthlyPrice: item.monthlyPrice,
        isActive: item.isActive,
        createdAt: item.createdAt?.toISOString?.() ?? '',
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
      filters: {
        search,
      },
    };
  }

  async getOrders(query: OrderListQuery) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10),
    );
    const search = query.search?.trim() ?? '';
    const requestedStatus = this.normalizeOrderStatus(query.status);
    const skip = (page - 1) * pageSize;

    const pipeline: PipelineStage[] = [
      {
        $match: this.buildVisiblePaymentFilter(),
      },
      {
        $addFields: {
          effectiveOrderStatus: {
            $ifNull: [
              '$orderStatus',
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$status', PaymentStatus.PENDING] },
                      then: OrderStatus.PENDING,
                    },
                    {
                      case: {
                        $in: ['$status', [PaymentStatus.CANCELLED, PaymentStatus.FAILED]],
                      },
                      then: OrderStatus.CANCELLED,
                    },
                    {
                      case: { $eq: ['$status', PaymentStatus.SUCCESS] },
                      then: OrderStatus.APPROVED,
                    },
                  ],
                  default: OrderStatus.PENDING,
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceTypes',
          foreignField: 'key',
          as: 'services',
        },
      },
    ];

    if (requestedStatus) {
      pipeline.push({
        $match: {
          effectiveOrderStatus: requestedStatus,
        },
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          txnRef: {
            $regex: this.escapeRegex(search),
            $options: 'i',
          },
        },
      });
    }

    const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' }];
    const itemsPipeline: PipelineStage[] = [
      ...pipeline,
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          txnRef: 1,
          amount: 1,
          createdAt: 1,
          paidAt: 1,
          orderStatus: '$effectiveOrderStatus',
          paymentStatus: '$status',
          accountName: {
            $ifNull: ['$profile.name', '$user.username'],
          },
          mobileNumber: '$user.mobileNumber',
          serviceNames: {
            $cond: [
              { $gt: [{ $size: '$services' }, 0] },
              '$services.name',
              '$serviceTypes',
            ],
          },
        },
      },
    ];

    const [countResult, items] = await Promise.all([
      this.paymentModel.aggregate<{ total: number }>(countPipeline),
      this.paymentModel.aggregate<OrderListItem>(itemsPipeline),
    ]);

    const totalItems = countResult[0]?.total ?? 0;

    return {
      items: items.map((item) => ({
        id: String(item._id),
        orderCode: item.txnRef,
        serviceName: item.serviceNames.join(', '),
        accountName: item.accountName,
        mobileNumber: item.mobileNumber,
        totalAmount: item.amount,
        registeredAt: item.createdAt?.toISOString() ?? '',
        paidAt: item.paidAt?.toISOString() ?? '',
        orderStatus: item.orderStatus ?? OrderStatus.PENDING,
        paymentStatus: item.paymentStatus,
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
      filters: {
        search,
        status: requestedStatus ?? OrderStatus.PENDING,
      },
    };
  }

  async createService(dto: CreateServiceDto, imageFile?: { path?: string }) {
    await this.ensureManagementActor(dto.actorUserId);

    const name = dto.name.trim();
    const description = dto.description.trim();
    const imageUrl = imageFile?.path
      ? this.toRelativeUploadPath(imageFile.path)
      : dto.imageUrl?.trim() || this.defaultAvatarPath;
    const key = await this.generateUniqueServiceKey(name);

    const createdService = await this.contentServiceModel.create({
      key,
      name,
      description,
      imageUrl,
      monthlyPrice: dto.monthlyPrice,
      isActive: dto.isActive ?? true,
    });

    this.emitServiceCatalogChanged();

    return {
      message: 'Service created successfully.',
      service: {
        id: String(createdService._id),
        key: createdService.key,
        name: createdService.name,
        description: createdService.description,
        imageUrl: this.toPublicAssetUrl(createdService.imageUrl),
        monthlyPrice: createdService.monthlyPrice,
        isActive: createdService.isActive,
      },
    };
  }

  async updateService(
    serviceId: string,
    dto: UpdateServiceDto,
    imageFile?: { path?: string },
  ) {
    await this.ensureManagementActor(dto.actorUserId);

    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid service id.');
    }

    const service = await this.contentServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    if (dto.name !== undefined) {
      service.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      service.description = dto.description.trim();
    }

    if (imageFile?.path) {
      const nextImageUrl = this.toRelativeUploadPath(imageFile.path);
      await this.deleteStoredImage(service.imageUrl);
      service.imageUrl = nextImageUrl;
    } else if (dto.imageUrl !== undefined && dto.imageUrl.trim()) {
      service.imageUrl = dto.imageUrl.trim();
    }

    if (dto.monthlyPrice !== undefined) {
      service.monthlyPrice = dto.monthlyPrice;
    }

    if (dto.isActive !== undefined) {
      service.isActive = dto.isActive;
    }

    await service.save();
    this.emitServiceCatalogChanged();

    return {
      message: 'Service updated successfully.',
      service: {
        id: String(service._id),
        key: service.key,
        name: service.name,
        description: service.description,
        imageUrl: this.toPublicAssetUrl(service.imageUrl),
        monthlyPrice: service.monthlyPrice,
        isActive: service.isActive,
      },
    };
  }

  async deleteService(serviceId: string, actorUserId: string) {
    await this.ensureManagementActor(actorUserId);

    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid service id.');
    }

    const service = await this.contentServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    service.isActive = false;
    await service.save();
    this.emitServiceCatalogChanged();

    return {
      message: 'Service deleted successfully.',
    };
  }

  async updateOrderStatus(orderId: string, actorUserId: string, nextStatusRaw: string) {
    await this.ensureManagementActor(actorUserId);

    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id.');
    }

    const nextStatus = this.normalizeOrderStatus(nextStatusRaw);
    if (!nextStatus) {
      throw new BadRequestException('Invalid order status.');
    }

    const order = await this.paymentModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const currentStatus = order.orderStatus ?? this.mapPaymentStatusToOrderStatus(order.status);

    if (currentStatus === OrderStatus.CANCELLED || currentStatus === OrderStatus.COMPLETED) {
      throw new BadRequestException('This order can no longer be changed.');
    }

    if (currentStatus === OrderStatus.PENDING && nextStatus !== OrderStatus.APPROVED) {
      if (nextStatus !== OrderStatus.CANCELLED) {
        throw new BadRequestException('Pending orders can only be approved or cancelled.');
      }
    }

    if (currentStatus === OrderStatus.APPROVED && nextStatus !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Approved orders can only be completed.');
    }

    order.orderStatus = nextStatus;
    if (nextStatus === OrderStatus.APPROVED || nextStatus === OrderStatus.COMPLETED) {
      order.status = PaymentStatus.SUCCESS;
      order.paidAt = order.paidAt ?? new Date();
    }

    if (nextStatus === OrderStatus.CANCELLED) {
      order.status = PaymentStatus.CANCELLED;
    }

    await order.save();
    this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');

    return {
      message:
        nextStatus === OrderStatus.APPROVED
          ? 'Order approved successfully.'
          : nextStatus === OrderStatus.COMPLETED
            ? 'Order completed successfully.'
            : 'Order cancelled successfully.',
    };
  }

  async getAccounts(query: AccountListQuery) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10),
    );
    const search = query.search?.trim() ?? '';
    const role = query.role?.trim().toLowerCase() ?? 'all';
    const skip = (page - 1) * pageSize;

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (role && role !== 'all' && this.isSupportedRole(role)) {
      pipeline.push({
        $match: {
          role,
        },
      });
    }

    if (search) {
      const escapedSearch = this.escapeRegex(search);
      pipeline.push({
        $match: {
          $or: [
            { username: { $regex: escapedSearch, $options: 'i' } },
            { mobileNumber: { $regex: escapedSearch, $options: 'i' } },
            { 'profile.name': { $regex: escapedSearch, $options: 'i' } },
          ],
        },
      });
    }

    const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' }];
    const itemsPipeline: PipelineStage[] = [
      ...pipeline,
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          mobileNumber: 1,
          role: 1,
          createdAt: 1,
          displayName: {
            $ifNull: ['$profile.name', '$username'],
          },
          gender: '$profile.gender',
          imageUrl: '$profile.imageUrl',
        },
      },
    ];

    const [countResult, items] = await Promise.all([
      this.userModel.aggregate<{ total: number }>(countPipeline),
      this.userModel.aggregate<{
        _id: Types.ObjectId;
        username: string;
        email: string;
        mobileNumber: string;
        role: string;
        createdAt?: Date;
        displayName: string;
        gender?: string;
        imageUrl?: string;
      }>(itemsPipeline),
    ]);

    const totalItems = countResult[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((item) => ({
        id: String(item._id),
        avatarUrl: this.toPublicAssetUrl(item.imageUrl ?? this.defaultAvatarPath),
        name: item.displayName,
        username: item.username,
        email: item.email,
        gender: item.gender ?? 'other',
        mobileNumber: item.mobileNumber,
        role: item.role,
        createdAt: item.createdAt?.toISOString() ?? '',
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      filters: {
        search,
        role: this.isSupportedRole(role) ? role : 'all',
      },
    };
  }

  private async getDailyRevenueForLastSevenDays() {
    const today = new Date();
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const items = await this.paymentModel.aggregate<DailyRevenueAggregate>([
      {
        $match: {
          status: PaymentStatus.SUCCESS,
          paidAt: {
            $gte: startDate,
            $lte: endOfToday,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$paidAt',
            },
          },
          revenue: { $sum: '$amount' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const aggregateMap = new Map(items.map((item) => [item._id, item]));
    const dailySeries: {
      dateKey: string;
      label: string;
      revenue: number;
      orderCount: number;
    }[] = [];

    for (let index = 0; index < 7; index += 1) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      const dateKey = this.toDateKey(currentDate);
      const aggregate = aggregateMap.get(dateKey);

      dailySeries.push({
        dateKey,
        label: currentDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        }),
        revenue: aggregate?.revenue ?? 0,
        orderCount: aggregate?.orderCount ?? 0,
      });
    }

    return dailySeries;
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toPublicAssetUrl(path?: string) {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private normalizeOrderStatus(status?: string) {
    const normalized = status?.trim().toLowerCase();

    if (
      normalized === OrderStatus.PENDING ||
      normalized === OrderStatus.APPROVED ||
      normalized === OrderStatus.COMPLETED ||
      normalized === OrderStatus.CANCELLED
    ) {
      return normalized;
    }

    return null;
  }

  private mapPaymentStatusToOrderStatus(status: PaymentStatus) {
    if (status === PaymentStatus.SUCCESS) {
      return OrderStatus.APPROVED;
    }

    if (status === PaymentStatus.CANCELLED || status === PaymentStatus.FAILED) {
      return OrderStatus.CANCELLED;
    }

    return OrderStatus.PENDING;
  }

  private buildVisiblePaymentFilter() {
    return {
      responseCode: { $ne: 'INIT' },
    };
  }

  private toRelativeUploadPath(absolutePath: string) {
    const normalizedPath = normalize(absolutePath);
    const normalizedUploadRoot = normalize(this.uploadsRoot);
    const relativePath = normalizedPath.replace(`${normalizedUploadRoot}`, '');
    return `/uploads${relativePath}`;
  }

  private async deleteStoredImage(imageUrl: string) {
    if (imageUrl === this.defaultAvatarPath || imageUrl.endsWith('/uploads/no-image.jpg')) {
      return;
    }

    if (!imageUrl.startsWith('/uploads/')) {
      return;
    }

    const absolutePath = join(process.cwd(), imageUrl.replace(/^\/+/, ''));
    const normalizedAbsolutePath = normalize(absolutePath);
    const normalizedUploadRoot = normalize(this.uploadsRoot);

    if (!normalizedAbsolutePath.startsWith(normalizedUploadRoot)) {
      return;
    }

    await this.deleteUploadedFile(normalizedAbsolutePath);
  }

  private async deleteUploadedFile(filePath?: string) {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing file cleanup failures.
    }
  }

  private isSupportedRole(role: string) {
    return (
      role === UserRole.SUPERADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.USER
    );
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async ensureManagementActor(actorUserId: string) {
    if (!Types.ObjectId.isValid(actorUserId)) {
      throw new BadRequestException('Invalid actor user id.');
    }

    const actor = await this.userModel.findById(actorUserId);
    if (!actor) {
      throw new NotFoundException('Actor account not found.');
    }

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only management accounts can manage services.');
    }

    return actor;
  }

  private async generateUniqueServiceKey(name: string) {
    const baseKey = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50) || 'service';

    let candidate = baseKey;
    let suffix = 2;

    while (await this.contentServiceModel.exists({ key: candidate })) {
      candidate = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private emitServiceCatalogChanged() {
    this.friendsRealtimeService.emitToUsers([], 'services-updated');
    this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
  }
async createBroadcastContent(dto: any) {
  try {
    // 0. Ghim ID Admin ở đây để tránh lỗi 'undefined' khi FE không gửi lên
    // ID này dùng để thỏa mãn cả logic tìm kiếm và lưu Database
    const adminId = '69e219439a52b345c0c82898'; 

    // 1. Lưu bản ghi vào bảng lịch sử service_contents
    const newContent = new this.serviceContentModel({
      serviceType: dto.serviceType, 
      title: dto.title,
      content: dto.content,
      scheduledTime: dto.scheduledTime,
      isSent: false,
    });
    const savedContent = await newContent.save();

    // 2. Tìm danh sách User ID
    const paidUsers = await this.paymentModel.find({
      serviceTypes: dto.serviceType,
      status: PaymentStatus.SUCCESS
    }).distinct('userId');

    if (paidUsers && paidUsers.length > 0) {
      // 3. Tạo tin nhắn tự động cho từng User
    // Sửa lại đoạn map trong Backend của bro:
const autoMessages = paidUsers.map(userId => ({
  senderId: new Types.ObjectId(adminId),
  receiverId: userId,
  recipientUserId: new Types.ObjectId(userId), 
  content: `[THÔNG BÁO TỰ ĐỘNG - ${dto.title}]: ${dto.content}`,
  type: 'text',
  isSystemMessage: true,
  createdAt: new Date(),

  recipientType: 'external', 
  
  senderUserId: new Types.ObjectId(adminId),
  recipientPhoneNumber: '0900000000'
}));
console.log('--- PHIÊN BẢN CODE MỚI NHẤT ĐÃ CHẠY - RECIPIENT TYPE PHẢI LÀ EXTERNAL ---');
console.log('Dữ liệu chuẩn bị lưu:', autoMessages[0].recipientType);

      // Lưu hàng loạt vào bảng messages
      await this.messageModel.insertMany(autoMessages);

      // 4. Bắn Socket Realtime
      paidUsers.forEach(userId => {
        this.friendsRealtimeService.emitToUsers([String(userId)], 'new-message', {
          senderId: adminId,
          content: dto.content,
          title: dto.title

        });
      });

      // 5. Cập nhật trạng thái
      savedContent.isSent = true;
      await savedContent.save();
    }
    
    return savedContent;
  } catch (error: any) {
    console.error('LỖI KHI TẠO BROADCAST:', error);
    // Quăng lỗi cụ thể ra để FE biết đường mà lần
    throw new InternalServerErrorException('Lỗi hệ thống: ' + (error.message || 'Unknown error'));
  }
}

async getBroadcastHistory(query: { page?: string; pageSize?: string }) {
  const page = parseInt(query.page || '1');
  const pageSize = parseInt(query.pageSize || '10');
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    this.serviceContentModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    this.serviceContentModel.countDocuments(),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
  };
  
}
async getRealServicesForSelect() {
    return await this.contentServiceModel.find({}, { key: 1, name: 1 }).lean();
  }
}
