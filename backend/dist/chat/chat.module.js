"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const message_schema_1 = require("../database/schemas/message.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_module_1 = require("../friends/friends.module");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            friends_module_1.FriendsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
                { name: friendship_schema_1.Friendship.name, schema: friendship_schema_1.FriendshipSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
            ]),
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map