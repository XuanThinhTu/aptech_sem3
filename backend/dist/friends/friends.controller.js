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
exports.FriendsController = void 0;
const common_1 = require("@nestjs/common");
const cancel_friend_request_dto_1 = require("./dto/cancel-friend-request.dto");
const remove_friend_dto_1 = require("./dto/remove-friend.dto");
const respond_friend_request_dto_1 = require("./dto/respond-friend-request.dto");
const send_friend_request_dto_1 = require("./dto/send-friend-request.dto");
const friends_service_1 = require("./friends.service");
let FriendsController = class FriendsController {
    friendsService;
    constructor(friendsService) {
        this.friendsService = friendsService;
    }
    searchUsers(userId, query) {
        return this.friendsService.searchUsers(userId, query);
    }
    sendFriendRequest(dto) {
        return this.friendsService.sendFriendRequest(dto.userId, dto.friendUserId);
    }
    cancelFriendRequest(dto) {
        return this.friendsService.cancelFriendRequest(dto.userId, dto.friendUserId);
    }
    removeFriend(dto) {
        return this.friendsService.removeFriend(dto.userId, dto.friendUserId);
    }
    getIncomingRequests(userId) {
        return this.friendsService.getIncomingRequests(userId);
    }
    respondToRequest(dto) {
        return this.friendsService.respondToRequest(dto.userId, dto.requestId, dto.action);
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_friend_request_dto_1.SendFriendRequestDto]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "sendFriendRequest", null);
__decorate([
    (0, common_1.Post)('request/cancel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cancel_friend_request_dto_1.CancelFriendRequestDto]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "cancelFriendRequest", null);
__decorate([
    (0, common_1.Post)('remove'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [remove_friend_dto_1.RemoveFriendDto]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "removeFriend", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "getIncomingRequests", null);
__decorate([
    (0, common_1.Post)('requests/respond'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [respond_friend_request_dto_1.RespondFriendRequestDto]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "respondToRequest", null);
exports.FriendsController = FriendsController = __decorate([
    (0, common_1.Controller)('friends'),
    __metadata("design:paramtypes", [friends_service_1.FriendsService])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map