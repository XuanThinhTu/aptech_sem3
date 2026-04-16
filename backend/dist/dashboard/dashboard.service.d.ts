import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { OrderStatus, UserRole } from '../database/enums/database.enums';
import { ContentService } from '../database/schemas/content-service.schema';
import { Payment } from '../database/schemas/payment.schema';
import { ServiceSubscription } from '../database/schemas/service-subscription.schema';
import { User } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
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
export declare class DashboardService {
    private readonly configService;
    private readonly friendsRealtimeService;
    private readonly userModel;
    private readonly contentServiceModel;
    private readonly serviceSubscriptionModel;
    private readonly paymentModel;
    private readonly backendBaseUrl;
    private readonly uploadsRoot;
    private readonly servicesUploadsRoot;
    private readonly defaultAvatarPath;
    constructor(configService: ConfigService, friendsRealtimeService: FriendsRealtimeService, userModel: Model<User>, contentServiceModel: Model<ContentService>, serviceSubscriptionModel: Model<ServiceSubscription>, paymentModel: Model<Payment>);
    getOverview(): Promise<{
        accounts: {
            total: number;
            online: number;
            offline: number;
            onlineRate: number;
        };
        services: {
            active: number;
            inactive: number;
            total: number;
            activeRate: number;
            totalSubscriptions: number;
            activeSubscriptions: number;
            subscriptionActiveRate: number;
        };
        orders: {
            total: number;
            pending: number;
            approved: number;
            completed: number;
            cancelled: number;
            failed: number;
            totalRevenue: number;
            revenueLast7Days: {
                dateKey: string;
                label: string;
                revenue: number;
                orderCount: number;
            }[];
        };
    }>;
    createAdminAccount(dto: CreateAdminAccountDto): Promise<{
        message: string;
        account: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: UserRole;
            avatarUrl: string;
        };
    }>;
    getServiceCatalog(query: ServiceListQuery): Promise<{
        items: {
            id: string;
            key: string;
            name: string;
            description: string;
            imageUrl: string;
            monthlyPrice: number;
            isActive: boolean;
            createdAt: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
        };
        filters: {
            search: string;
        };
    }>;
    getOrders(query: OrderListQuery): Promise<{
        items: {
            id: string;
            orderCode: string;
            serviceName: string;
            accountName: string;
            mobileNumber: string;
            totalAmount: number;
            registeredAt: string;
            paidAt: string;
            orderStatus: string;
            paymentStatus: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
        };
        filters: {
            search: string;
            status: OrderStatus;
        };
    }>;
    createService(dto: CreateServiceDto, imageFile?: {
        path?: string;
    }): Promise<{
        message: string;
        service: {
            id: string;
            key: string;
            name: string;
            description: string;
            imageUrl: string;
            monthlyPrice: number;
            isActive: boolean;
        };
    }>;
    updateService(serviceId: string, dto: UpdateServiceDto, imageFile?: {
        path?: string;
    }): Promise<{
        message: string;
        service: {
            id: string;
            key: string;
            name: string;
            description: string;
            imageUrl: string;
            monthlyPrice: number;
            isActive: boolean;
        };
    }>;
    deleteService(serviceId: string, actorUserId: string): Promise<{
        message: string;
    }>;
    updateOrderStatus(orderId: string, actorUserId: string, nextStatusRaw: string): Promise<{
        message: string;
    }>;
    getAccounts(query: AccountListQuery): Promise<{
        items: {
            id: string;
            avatarUrl: string;
            name: string;
            username: string;
            email: string;
            gender: string;
            mobileNumber: string;
            role: string;
            createdAt: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
        };
        filters: {
            search: string;
            role: string;
        };
    }>;
    private getDailyRevenueForLastSevenDays;
    private toDateKey;
    private toPublicAssetUrl;
    private normalizeOrderStatus;
    private mapPaymentStatusToOrderStatus;
    private buildVisiblePaymentFilter;
    private toRelativeUploadPath;
    private deleteStoredImage;
    private deleteUploadedFile;
    private isSupportedRole;
    private escapeRegex;
    private ensureManagementActor;
    private generateUniqueServiceKey;
    private emitServiceCatalogChanged;
}
export {};
