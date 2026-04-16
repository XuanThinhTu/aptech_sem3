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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingRegistrationSchema = exports.PendingRegistration = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PendingRegistration = class PendingRegistration {
    username;
    email;
    mobileNumber;
    passwordHash;
    otpCode;
    expiresAt;
    attempts;
};
exports.PendingRegistration = PendingRegistration;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, unique: true, minlength: 3, maxlength: 30 }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, lowercase: true, unique: true }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, match: /^\d{10}$/ }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "mobileNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, match: /^\d{6}$/ }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "otpCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PendingRegistration.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PendingRegistration.prototype, "attempts", void 0);
exports.PendingRegistration = PendingRegistration = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'pending_registrations',
        timestamps: true,
    })
], PendingRegistration);
exports.PendingRegistrationSchema = mongoose_1.SchemaFactory.createForClass(PendingRegistration);
exports.PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=pending-registration.schema.js.map