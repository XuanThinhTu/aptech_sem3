"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const path_1 = require("path");
const database_enums_1 = require("../database/enums/database.enums");
const content_service_schema_1 = require("../database/schemas/content-service.schema");
const payment_schema_1 = require("../database/schemas/payment.schema");
const service_subscription_schema_1 = require("../database/schemas/service-subscription.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_realtime_service_1 = require("../friends/friends-realtime.service");
let DashboardService = class DashboardService {
    configService;
    friendsRealtimeService;
    userModel;
    contentServiceModel;
    serviceSubscriptionModel;
    paymentModel;
    backendBaseUrl;
    uploadsRoot = (0, path_1.join)(process.cwd(), 'uploads');
    servicesUploadsRoot = (0, path_1.join)(this.uploadsRoot, 'services');
    defaultAvatarPath = '/uploads/no-image.jpg';
    constructor(configService, friendsRealtimeService, userModel, contentServiceModel, serviceSubscriptionModel, paymentModel) {
        this.configService = configService;
        this.friendsRealtimeService = friendsRealtimeService;
        this.userModel = userModel;
        this.contentServiceModel = contentServiceModel;
        this.serviceSubscriptionModel = serviceSubscriptionModel;
        this.paymentModel = paymentModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
        if (!(0, fs_1.existsSync)(this.servicesUploadsRoot)) {
            (0, fs_1.mkdirSync)(this.servicesUploadsRoot, { recursive: true });
        }
    }
    async getOverview() {
        const onlineUsers = friends_realtime_service_1.FriendsRealtimeService.countOnlineUsers();
        const visiblePaymentFilter = this.buildVisiblePaymentFilter();
        const [totalAccounts, activeServices, totalServices, totalSubscriptions, activeSubscriptions, totalOrders, pendingOrders, successOrders, failedOrders, cancelledOrders, totalRevenueResult, revenueByDay,] = await Promise.all([
            this.userModel.countDocuments(),
            this.contentServiceModel.countDocuments({ isActive: true }),
            this.contentServiceModel.countDocuments(),
            this.serviceSubscriptionModel.countDocuments(),
            this.serviceSubscriptionModel.countDocuments({
                status: database_enums_1.SubscriptionStatus.ACTIVE,
            }),
            this.paymentModel.countDocuments(visiblePaymentFilter),
            this.paymentModel.countDocuments({
                ...visiblePaymentFilter,
                status: database_enums_1.PaymentStatus.PENDING,
            }),
            this.paymentModel.countDocuments({
                ...visiblePaymentFilter,
                status: database_enums_1.PaymentStatus.SUCCESS,
            }),
            this.paymentModel.countDocuments({
                ...visiblePaymentFilter,
                status: database_enums_1.PaymentStatus.FAILED,
            }),
            this.paymentModel.countDocuments({
                ...visiblePaymentFilter,
                status: database_enums_1.PaymentStatus.CANCELLED,
            }),
            this.paymentModel.aggregate([
                { $match: { ...visiblePaymentFilter, status: database_enums_1.PaymentStatus.SUCCESS } },
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
    async createAdminAccount(dto) {
        const actor = await this.userModel.findById(dto.actorUserId);
        if (!actor || actor.role !== database_enums_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Only the superadmin can create admin accounts.');
        }
        const username = dto.username.trim();
        const email = dto.email.trim().toLowerCase();
        const mobileNumber = dto.mobileNumber.trim();
        const existingUser = await this.userModel.findOne({
            $or: [{ username }, { email }, { mobileNumber }],
        });
        if (existingUser) {
            if (existingUser.username === username) {
                throw new common_1.BadRequestException('This username has already been registered.');
            }
            if (existingUser.email === email) {
                throw new common_1.BadRequestException('This email has already been registered.');
            }
            throw new common_1.BadRequestException('THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY');
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
            role: database_enums_1.UserRole.ADMIN,
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
    async getServiceCatalog(query) {
        const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
        const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10));
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
                .lean(),
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
    async getOrders(query) {
        const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
        const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10));
        const search = query.search?.trim() ?? '';
        const requestedStatus = this.normalizeOrderStatus(query.status);
        const skip = (page - 1) * pageSize;
        const pipeline = [
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
                                            case: { $eq: ['$status', database_enums_1.PaymentStatus.PENDING] },
                                            then: database_enums_1.OrderStatus.PENDING,
                                        },
                                        {
                                            case: {
                                                $in: ['$status', [database_enums_1.PaymentStatus.CANCELLED, database_enums_1.PaymentStatus.FAILED]],
                                            },
                                            then: database_enums_1.OrderStatus.CANCELLED,
                                        },
                                        {
                                            case: { $eq: ['$status', database_enums_1.PaymentStatus.SUCCESS] },
                                            then: database_enums_1.OrderStatus.APPROVED,
                                        },
                                    ],
                                    default: database_enums_1.OrderStatus.PENDING,
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
        const countPipeline = [...pipeline, { $count: 'total' }];
        const itemsPipeline = [
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
            this.paymentModel.aggregate(countPipeline),
            this.paymentModel.aggregate(itemsPipeline),
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
                orderStatus: item.orderStatus ?? database_enums_1.OrderStatus.PENDING,
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
                status: requestedStatus ?? database_enums_1.OrderStatus.PENDING,
            },
        };
    }
    async createService(dto, imageFile) {
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
    async updateService(serviceId, dto, imageFile) {
        await this.ensureManagementActor(dto.actorUserId);
        if (!mongoose_2.Types.ObjectId.isValid(serviceId)) {
            throw new common_1.BadRequestException('Invalid service id.');
        }
        const service = await this.contentServiceModel.findById(serviceId);
        if (!service) {
            throw new common_1.NotFoundException('Service not found.');
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
        }
        else if (dto.imageUrl !== undefined && dto.imageUrl.trim()) {
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
    async deleteService(serviceId, actorUserId) {
        await this.ensureManagementActor(actorUserId);
        if (!mongoose_2.Types.ObjectId.isValid(serviceId)) {
            throw new common_1.BadRequestException('Invalid service id.');
        }
        const service = await this.contentServiceModel.findById(serviceId);
        if (!service) {
            throw new common_1.NotFoundException('Service not found.');
        }
        service.isActive = false;
        await service.save();
        this.emitServiceCatalogChanged();
        return {
            message: 'Service deleted successfully.',
        };
    }
    async updateOrderStatus(orderId, actorUserId, nextStatusRaw) {
        await this.ensureManagementActor(actorUserId);
        if (!mongoose_2.Types.ObjectId.isValid(orderId)) {
            throw new common_1.BadRequestException('Invalid order id.');
        }
        const nextStatus = this.normalizeOrderStatus(nextStatusRaw);
        if (!nextStatus) {
            throw new common_1.BadRequestException('Invalid order status.');
        }
        const order = await this.paymentModel.findById(orderId);
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        const currentStatus = order.orderStatus ?? this.mapPaymentStatusToOrderStatus(order.status);
        if (currentStatus === database_enums_1.OrderStatus.CANCELLED || currentStatus === database_enums_1.OrderStatus.COMPLETED) {
            throw new common_1.BadRequestException('This order can no longer be changed.');
        }
        if (currentStatus === database_enums_1.OrderStatus.PENDING && nextStatus !== database_enums_1.OrderStatus.APPROVED) {
            if (nextStatus !== database_enums_1.OrderStatus.CANCELLED) {
                throw new common_1.BadRequestException('Pending orders can only be approved or cancelled.');
            }
        }
        if (currentStatus === database_enums_1.OrderStatus.APPROVED && nextStatus !== database_enums_1.OrderStatus.COMPLETED) {
            throw new common_1.BadRequestException('Approved orders can only be completed.');
        }
        order.orderStatus = nextStatus;
        if (nextStatus === database_enums_1.OrderStatus.APPROVED || nextStatus === database_enums_1.OrderStatus.COMPLETED) {
            order.status = database_enums_1.PaymentStatus.SUCCESS;
            order.paidAt = order.paidAt ?? new Date();
        }
        if (nextStatus === database_enums_1.OrderStatus.CANCELLED) {
            order.status = database_enums_1.PaymentStatus.CANCELLED;
        }
        await order.save();
        this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
        return {
            message: nextStatus === database_enums_1.OrderStatus.APPROVED
                ? 'Order approved successfully.'
                : nextStatus === database_enums_1.OrderStatus.COMPLETED
                    ? 'Order completed successfully.'
                    : 'Order cancelled successfully.',
        };
    }
    async getAccounts(query) {
        const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
        const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10));
        const search = query.search?.trim() ?? '';
        const role = query.role?.trim().toLowerCase() ?? 'all';
        const skip = (page - 1) * pageSize;
        const pipeline = [
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
        const countPipeline = [...pipeline, { $count: 'total' }];
        const itemsPipeline = [
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
            this.userModel.aggregate(countPipeline),
            this.userModel.aggregate(itemsPipeline),
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
    async getDailyRevenueForLastSevenDays() {
        const today = new Date();
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        const items = await this.paymentModel.aggregate([
            {
                $match: {
                    status: database_enums_1.PaymentStatus.SUCCESS,
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
        const dailySeries = [];
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
    toDateKey(date) {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    toPublicAssetUrl(path) {
        if (!path) {
            return '';
        }
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
    normalizeOrderStatus(status) {
        const normalized = status?.trim().toLowerCase();
        if (normalized === database_enums_1.OrderStatus.PENDING ||
            normalized === database_enums_1.OrderStatus.APPROVED ||
            normalized === database_enums_1.OrderStatus.COMPLETED ||
            normalized === database_enums_1.OrderStatus.CANCELLED) {
            return normalized;
        }
        return null;
    }
    mapPaymentStatusToOrderStatus(status) {
        if (status === database_enums_1.PaymentStatus.SUCCESS) {
            return database_enums_1.OrderStatus.APPROVED;
        }
        if (status === database_enums_1.PaymentStatus.CANCELLED || status === database_enums_1.PaymentStatus.FAILED) {
            return database_enums_1.OrderStatus.CANCELLED;
        }
        return database_enums_1.OrderStatus.PENDING;
    }
    buildVisiblePaymentFilter() {
        return {
            responseCode: { $ne: 'INIT' },
        };
    }
    toRelativeUploadPath(absolutePath) {
        const normalizedPath = (0, path_1.normalize)(absolutePath);
        const normalizedUploadRoot = (0, path_1.normalize)(this.uploadsRoot);
        const relativePath = normalizedPath.replace(`${normalizedUploadRoot}`, '');
        return `/uploads${relativePath}`;
    }
    async deleteStoredImage(imageUrl) {
        if (imageUrl === this.defaultAvatarPath || imageUrl.endsWith('/uploads/no-image.jpg')) {
            return;
        }
        if (!imageUrl.startsWith('/uploads/')) {
            return;
        }
        const absolutePath = (0, path_1.join)(process.cwd(), imageUrl.replace(/^\/+/, ''));
        const normalizedAbsolutePath = (0, path_1.normalize)(absolutePath);
        const normalizedUploadRoot = (0, path_1.normalize)(this.uploadsRoot);
        if (!normalizedAbsolutePath.startsWith(normalizedUploadRoot)) {
            return;
        }
        await this.deleteUploadedFile(normalizedAbsolutePath);
    }
    async deleteUploadedFile(filePath) {
        if (!filePath) {
            return;
        }
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
    }
    isSupportedRole(role) {
        return (role === database_enums_1.UserRole.SUPERADMIN ||
            role === database_enums_1.UserRole.ADMIN ||
            role === database_enums_1.UserRole.USER);
    }
    escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    async ensureManagementActor(actorUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(actorUserId)) {
            throw new common_1.BadRequestException('Invalid actor user id.');
        }
        const actor = await this.userModel.findById(actorUserId);
        if (!actor) {
            throw new common_1.NotFoundException('Actor account not found.');
        }
        if (actor.role !== database_enums_1.UserRole.ADMIN && actor.role !== database_enums_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Only management accounts can manage services.');
        }
        return actor;
    }
    async generateUniqueServiceKey(name) {
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
    emitServiceCatalogChanged() {
        this.friendsRealtimeService.emitToUsers([], 'services-updated');
        this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_1.InjectModel)(content_service_schema_1.ContentService.name)),
    __param(4, (0, mongoose_1.InjectModel)(service_subscription_schema_1.ServiceSubscription.name)),
    __param(5, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        friends_realtime_service_1.FriendsRealtimeService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map