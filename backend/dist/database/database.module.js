"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const database_controller_1 = require("./database.controller");
const database_service_1 = require("./database.service");
const contact_schema_1 = require("./schemas/contact.schema");
const content_service_schema_1 = require("./schemas/content-service.schema");
const friend_request_schema_1 = require("./schemas/friend-request.schema");
const friendship_schema_1 = require("./schemas/friendship.schema");
const message_schema_1 = require("./schemas/message.schema");
const payment_schema_1 = require("./schemas/payment.schema");
const profile_schema_1 = require("./schemas/profile.schema");
const service_subscription_schema_1 = require("./schemas/service-subscription.schema");
const user_schema_1 = require("./schemas/user.schema");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
                { name: contact_schema_1.Contact.name, schema: contact_schema_1.ContactSchema },
                { name: content_service_schema_1.ContentService.name, schema: content_service_schema_1.ContentServiceSchema },
                { name: friend_request_schema_1.FriendRequest.name, schema: friend_request_schema_1.FriendRequestSchema },
                { name: friendship_schema_1.Friendship.name, schema: friendship_schema_1.FriendshipSchema },
                { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
                { name: service_subscription_schema_1.ServiceSubscription.name, schema: service_subscription_schema_1.ServiceSubscriptionSchema },
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
            ]),
        ],
        controllers: [database_controller_1.DatabaseController],
        providers: [database_service_1.DatabaseService],
        exports: [mongoose_1.MongooseModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map