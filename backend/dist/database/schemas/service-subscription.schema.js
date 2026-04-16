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
exports.ServiceSubscriptionSchema = exports.ServiceSubscription = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../enums/database.enums");
const user_schema_1 = require("./user.schema");
let ServiceSubscription = class ServiceSubscription {
    userId;
    serviceType;
    status;
    autoRenew;
    activatedAt;
    expiresAt;
    priceAmount;
};
exports.ServiceSubscription = ServiceSubscription;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ServiceSubscription.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.SubscriptionServiceType, required: true }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "serviceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.SubscriptionStatus, default: database_enums_1.SubscriptionStatus.PENDING }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ServiceSubscription.prototype, "autoRenew", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ServiceSubscription.prototype, "activatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ServiceSubscription.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ServiceSubscription.prototype, "priceAmount", void 0);
exports.ServiceSubscription = ServiceSubscription = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'service_subscriptions',
        timestamps: true,
    })
], ServiceSubscription);
exports.ServiceSubscriptionSchema = mongoose_1.SchemaFactory.createForClass(ServiceSubscription);
exports.ServiceSubscriptionSchema.index({ userId: 1, serviceType: 1 }, { unique: true });
//# sourceMappingURL=service-subscription.schema.js.map