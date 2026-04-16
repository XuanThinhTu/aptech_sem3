"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
const create_admin_account_dto_1 = require("./dto/create-admin-account.dto");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const dashboard_service_1 = require("./dashboard.service");
const { diskStorage } = require('multer');
const serviceUploadRoot = (0, path_1.join)(process.cwd(), 'uploads', 'services');
if (!(0, fs_1.existsSync)(serviceUploadRoot)) {
    (0, fs_1.mkdirSync)(serviceUploadRoot, { recursive: true });
}
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getOverview() {
        return this.dashboardService.getOverview();
    }
    getAccounts(page, pageSize, search, role) {
        return this.dashboardService.getAccounts({
            page,
            pageSize,
            search,
            role,
        });
    }
    createAdminAccount(dto) {
        return this.dashboardService.createAdminAccount(dto);
    }
    getServices(page, pageSize, search) {
        return this.dashboardService.getServiceCatalog({
            page,
            pageSize,
            search,
        });
    }
    createService(dto, imageFile) {
        return this.dashboardService.createService(dto, imageFile);
    }
    updateService(serviceId, dto, imageFile) {
        return this.dashboardService.updateService(serviceId, dto, imageFile);
    }
    deleteService(serviceId, actorUserId) {
        return this.dashboardService.deleteService(serviceId, actorUserId);
    }
    getOrders(page, pageSize, search, status) {
        return this.dashboardService.getOrders({
            page,
            pageSize,
            search,
            status,
        });
    }
    updateOrderStatus(orderId, dto) {
        return this.dashboardService.updateOrderStatus(orderId, dto.actorUserId, dto.status);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)('accounts/admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_account_dto_1.CreateAdminAccountDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "createAdminAccount", null);
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getServices", null);
__decorate([
    (0, common_1.Post)('services'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: diskStorage({
            destination: serviceUploadRoot,
            filename: (_req, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                callback(new common_1.BadRequestException('Only image files are allowed.'), false);
                return;
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_dto_1.CreateServiceDto, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "createService", null);
__decorate([
    (0, common_1.Put)('services/:serviceId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: diskStorage({
            destination: serviceUploadRoot,
            filename: (_req, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                callback(new common_1.BadRequestException('Only image files are allowed.'), false);
                return;
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('serviceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_dto_1.UpdateServiceDto, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:serviceId'),
    __param(0, (0, common_1.Param)('serviceId')),
    __param(1, (0, common_1.Query)('actorUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/status'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updateOrderStatus", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map