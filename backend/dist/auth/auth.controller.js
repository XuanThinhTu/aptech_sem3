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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const request_register_otp_dto_1 = require("./dto/request-register-otp.dto");
const verify_register_otp_dto_1 = require("./dto/verify-register-otp.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    checkUsername(username) {
        return this.authService.checkUsernameAvailability(username);
    }
    checkMobile(mobileNumber) {
        return this.authService.checkMobileAvailability(mobileNumber);
    }
    requestRegisterOtp(dto) {
        return this.authService.requestRegisterOtp(dto);
    }
    verifyRegisterOtp(dto) {
        return this.authService.verifyRegisterOtp(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('check-username'),
    __param(0, (0, common_1.Query)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "checkUsername", null);
__decorate([
    (0, common_1.Get)('check-mobile'),
    __param(0, (0, common_1.Query)('mobileNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "checkMobile", null);
__decorate([
    (0, common_1.Post)('register/request-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_register_otp_dto_1.RequestRegisterOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestRegisterOtp", null);
__decorate([
    (0, common_1.Post)('register/verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_register_otp_dto_1.VerifyRegisterOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyRegisterOtp", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map