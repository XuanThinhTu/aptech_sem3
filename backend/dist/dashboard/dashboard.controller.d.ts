import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
    getAccounts(page?: string, pageSize?: string, search?: string, role?: string): Promise<{
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
    createAdminAccount(dto: CreateAdminAccountDto): Promise<{
        message: string;
        account: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: import("../database/enums/database.enums").UserRole;
            avatarUrl: string;
        };
    }>;
    getServices(page?: string, pageSize?: string, search?: string): Promise<{
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
    getOrders(page?: string, pageSize?: string, search?: string, status?: string): Promise<{
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
            status: import("../database/enums/database.enums").OrderStatus;
        };
    }>;
    updateOrderStatus(orderId: string, dto: {
        actorUserId: string;
        status: string;
    }): Promise<{
        message: string;
    }>;
}
