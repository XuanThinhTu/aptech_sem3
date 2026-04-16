"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
let DatabaseService = class DatabaseService {
    getSchemaOverview() {
        return {
            collections: [
                {
                    name: 'users',
                    purpose: 'Tai khoan dang nhap voi email, so dien thoai va role user/admin',
                },
                {
                    name: 'pending_registrations',
                    purpose: 'Dang ky tam va ma OTP truoc khi tao tai khoan that',
                },
                {
                    name: 'profiles',
                    purpose: 'Thong tin ca nhan va nghe nghiep cua nguoi dung',
                },
                {
                    name: 'contacts',
                    purpose: 'Danh ba rieng cua tung nguoi dung',
                },
                {
                    name: 'friend_requests',
                    purpose: 'Luu yeu cau ket ban va trang thai chap nhan/tu choi',
                },
                {
                    name: 'friendships',
                    purpose: 'Danh sach ban be sau khi loi moi duoc chap nhan',
                },
                {
                    name: 'messages',
                    purpose: 'Lich su gui SMS cho ban be, danh ba va so ngoai he thong',
                },
                {
                    name: 'services',
                    purpose: 'Danh muc dich vu hien thi o trang Activation of Services',
                },
                {
                    name: 'service_subscriptions',
                    purpose: 'Cac dich vu noi dung da dang ky nhu joke, sports, news',
                },
                {
                    name: 'payments',
                    purpose: 'Giao dich thanh toan kich hoat dich vu qua VNPAY',
                },
            ],
            keyRules: [
                'username, email va mobileNumber la duy nhat',
                'Noi dung message toi da 120 ky tu',
                'Moi contact number chi duoc luu mot lan trong danh ba cua cung mot owner',
                'Moi user chi co mot profile',
                'Moi user chi dang ky toi da mot lan cho moi loai dich vu',
            ],
        };
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map