"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const content_service_schema_1 = require("../database/schemas/content-service.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const payment_schema_1 = require("../database/schemas/payment.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const service_subscription_schema_1 = require("../database/schemas/service-subscription.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_module_1 = require("../friends/friends.module");
const home_controller_1 = require("./home.controller");
const home_service_1 = require("./home.service");
const payment_service_1 = require("../payments/payment.service");
let HomeModule = class HomeModule {
};
exports.HomeModule = HomeModule;
exports.HomeModule = HomeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            friends_module_1.FriendsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: content_service_schema_1.ContentService.name, schema: content_service_schema_1.ContentServiceSchema },
                { name: friendship_schema_1.Friendship.name, schema: friendship_schema_1.FriendshipSchema },
                { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
                { name: service_subscription_schema_1.ServiceSubscription.name, schema: service_subscription_schema_1.ServiceSubscriptionSchema },
            ]),
        ],
        controllers: [home_controller_1.HomeController],
        providers: [home_service_1.HomeService, payment_service_1.PaypalService],
    })
], HomeModule);
//# sourceMappingURL=home.module.js.map