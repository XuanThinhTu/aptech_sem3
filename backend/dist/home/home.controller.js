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
exports.HomeController = void 0;
const common_1 = require("@nestjs/common");
const create_subscription_checkout_dto_1 = require("./dto/create-subscription-checkout.dto");
const home_service_1 = require("./home.service");
let HomeController = class HomeController {
    homeService;
    constructor(homeService) {
        this.homeService = homeService;
    }
    getServices() {
        return this.homeService.getServices();
    }
    getFriends(userId) {
        return this.homeService.getFriends(userId);
    }
    createSubscriptionCheckout(dto) {
        return this.homeService.createSubscriptionCheckout(dto);
    }
    async handleVnpayReturn(query, res) {
        const redirectUrl = await this.homeService.handleVnpayReturn(query);
        return res.redirect(redirectUrl);
    }
};
exports.HomeController = HomeController;
__decorate([
    (0, common_1.Get)('services'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HomeController.prototype, "getServices", null);
__decorate([
    (0, common_1.Get)('friends'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeController.prototype, "getFriends", null);
__decorate([
    (0, common_1.Post)('subscriptions/checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_checkout_dto_1.CreateSubscriptionCheckoutDto]),
    __metadata("design:returntype", void 0)
], HomeController.prototype, "createSubscriptionCheckout", null);
__decorate([
    (0, common_1.Get)('subscriptions/vnpay-return'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "handleVnpayReturn", null);
exports.HomeController = HomeController = __decorate([
    (0, common_1.Controller)('home'),
    __metadata("design:paramtypes", [home_service_1.HomeService])
], HomeController);
//# sourceMappingURL=home.controller.js.map