"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const friend_request_schema_1 = require("../database/schemas/friend-request.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_controller_1 = require("./friends.controller");
const friends_realtime_service_1 = require("./friends-realtime.service");
const friends_service_1 = require("./friends.service");
let FriendsModule = class FriendsModule {
};
exports.FriendsModule = FriendsModule;
exports.FriendsModule = FriendsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
                { name: friend_request_schema_1.FriendRequest.name, schema: friend_request_schema_1.FriendRequestSchema },
                { name: friendship_schema_1.Friendship.name, schema: friendship_schema_1.FriendshipSchema },
            ]),
        ],
        controllers: [friends_controller_1.FriendsController],
        providers: [friends_service_1.FriendsService, friends_realtime_service_1.FriendsRealtimeService],
        exports: [friends_realtime_service_1.FriendsRealtimeService],
    })
], FriendsModule);
//# sourceMappingURL=friends.module.js.map