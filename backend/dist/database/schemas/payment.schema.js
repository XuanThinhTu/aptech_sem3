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
exports.PaymentSchema = exports.Payment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../enums/database.enums");
const user_schema_1 = require("./user.schema");
let Payment = class Payment {
    userId;
    provider;
    txnRef;
    amount;
    currency;
    status;
    orderStatus;
    serviceTypes;
    orderInfo;
    responseCode;
    paidAt;
};
exports.Payment = Payment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Payment.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.PaymentProvider, default: database_enums_1.PaymentProvider.VNPAY }),
    __metadata("design:type", String)
], Payment.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, unique: true }),
    __metadata("design:type", String)
], Payment.prototype, "txnRef", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, uppercase: true, default: 'VND' }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.PaymentStatus, default: database_enums_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.OrderStatus, default: database_enums_1.OrderStatus.PENDING }),
    __metadata("design:type", String)
], Payment.prototype, "orderStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Payment.prototype, "serviceTypes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Payment.prototype, "orderInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Payment.prototype, "responseCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Payment.prototype, "paidAt", void 0);
exports.Payment = Payment = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'payments',
        timestamps: true,
    })
], Payment);
exports.PaymentSchema = mongoose_1.SchemaFactory.createForClass(Payment);
//# sourceMappingURL=payment.schema.js.map