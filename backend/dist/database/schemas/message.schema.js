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
exports.MessageSchema = exports.Message = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../enums/database.enums");
const user_schema_1 = require("./user.schema");
const conversation_schema_1 = require("./conversation.schema");
let Message = class Message {
    senderUserId;
    recipientUserId;
    recipientPhoneNumber;
    recipientName;
    conversationId;
    content;
    recipientType;
    isFree;
    chargeAmount;
    countedAgainstDailyFreeLimit;
    deliveryStatus;
    isRead;
    readAt;
    sentAt;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "senderUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "recipientUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, match: /^\d{10}$/ }),
    __metadata("design:type", String)
], Message.prototype, "recipientPhoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Message.prototype, "recipientName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: conversation_schema_1.Conversation.name, required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.MessageRecipientType, required: true }),
    __metadata("design:type", String)
], Message.prototype, "recipientType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isFree", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Message.prototype, "chargeAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "countedAgainstDailyFreeLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.MessageDeliveryStatus, default: database_enums_1.MessageDeliveryStatus.QUEUED }),
    __metadata("design:type", String)
], Message.prototype, "deliveryStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isRead", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Message.prototype, "readAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Message.prototype, "sentAt", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'messages',
        timestamps: true,
    })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ senderUserId: 1, recipientPhoneNumber: 1, createdAt: -1 });
exports.MessageSchema.index({ recipientUserId: 1, senderUserId: 1, isRead: 1, createdAt: -1 });
exports.MessageSchema.index({ conversationId: 1, createdAt: -1 });
exports.MessageSchema.index({ senderUserId: 1, createdAt: -1 });
//# sourceMappingURL=message.schema.js.map