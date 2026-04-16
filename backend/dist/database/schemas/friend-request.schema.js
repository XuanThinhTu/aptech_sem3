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
exports.FriendRequestSchema = exports.FriendRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../enums/database.enums");
const user_schema_1 = require("./user.schema");
let FriendRequest = class FriendRequest {
    senderUserId;
    receiverUserId;
    receiverEmail;
    status;
    respondedAt;
};
exports.FriendRequest = FriendRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], FriendRequest.prototype, "senderUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], FriendRequest.prototype, "receiverUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, lowercase: true, maxlength: 120 }),
    __metadata("design:type", String)
], FriendRequest.prototype, "receiverEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.FriendRequestStatus, default: database_enums_1.FriendRequestStatus.PENDING }),
    __metadata("design:type", String)
], FriendRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], FriendRequest.prototype, "respondedAt", void 0);
exports.FriendRequest = FriendRequest = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'friend_requests',
        timestamps: true,
    })
], FriendRequest);
exports.FriendRequestSchema = mongoose_1.SchemaFactory.createForClass(FriendRequest);
exports.FriendRequestSchema.index({ senderUserId: 1, receiverUserId: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: database_enums_1.FriendRequestStatus.PENDING },
});
//# sourceMappingURL=friend-request.schema.js.map