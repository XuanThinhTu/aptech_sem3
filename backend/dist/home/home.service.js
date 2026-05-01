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
exports.HomeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const crypto_1 = require("crypto");
const mongoose_2 = require("mongoose");
const payment_service_1 = require("../payments/payment.service");
const database_enums_1 = require("../database/enums/database.enums");
const content_service_schema_1 = require("../database/schemas/content-service.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const payment_schema_1 = require("../database/schemas/payment.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const service_subscription_schema_1 = require("../database/schemas/service-subscription.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_realtime_service_1 = require("../friends/friends-realtime.service");
let HomeService = class HomeService {
    configService;
    friendsRealtimeService;
    paypalService;
    contentServiceModel;
    friendshipModel;
    messageModel;
    paymentModel;
    serviceSubscriptionModel;
    userModel;
    profileModel;
    backendBaseUrl;
    frontendBaseUrl;
    defaultAvatarPath = '/uploads/no-image.jpg';
    vnpayUrl;
    vnpayTmnCode;
    vnpayHashSecret;
    vnpayOrderType;
    vnpayLocale;
    vnpayCurrency;
    constructor(configService, friendsRealtimeService, paypalService, contentServiceModel, friendshipModel, messageModel, paymentModel, serviceSubscriptionModel, userModel, profileModel) {
        this.configService = configService;
        this.friendsRealtimeService = friendsRealtimeService;
        this.paypalService = paypalService;
        this.contentServiceModel = contentServiceModel;
        this.friendshipModel = friendshipModel;
        this.messageModel = messageModel;
        this.paymentModel = paymentModel;
        this.serviceSubscriptionModel = serviceSubscriptionModel;
        this.userModel = userModel;
        this.profileModel = profileModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
        this.frontendBaseUrl =
            this.configService.get('FRONTEND_BASE_URL') ?? 'http://127.0.0.1:4200';
        this.vnpayUrl =
            this.configService.get('VNPAY_URL') ??
                'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.vnpayTmnCode = this.configService.get('VNPAY_TMN_CODE') ?? '';
        this.vnpayHashSecret = this.configService.get('VNPAY_HASH_SECRET') ?? '';
        this.vnpayOrderType = this.configService.get('VNPAY_ORDER_TYPE') ?? 'Bill Payment';
        this.vnpayLocale = this.configService.get('VNPAY_LOCALE') ?? 'vn';
        this.vnpayCurrency = this.configService.get('VNPAY_CURRENCY') ?? 'VND';
    }
    async getServices() {
        const services = await this.contentServiceModel
            .find({ isActive: true })
            .sort({ createdAt: -1, _id: -1 })
            .lean();
        return services.map((service) => ({
            id: String(service._id),
            key: service.key,
            title: service.name,
            description: service.description,
            imageUrl: this.toPublicAssetUrl(service.imageUrl),
            monthlyPrice: service.monthlyPrice,
        }));
    }
    async getFriends(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            return [];
        }
        const friendships = await this.friendshipModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .lean();
        if (!friendships.length) {
            return [];
        }
        const friendIds = friendships.map((friendship) => friendship.friendUserId);
        const [users, profiles, unreadItems] = await Promise.all([
            this.userModel
                .find({ _id: { $in: friendIds } })
                .select('username email mobileNumber')
                .lean(),
            this.profileModel
                .find({ userId: { $in: friendIds } })
                .select('userId name imageUrl')
                .lean(),
            this.messageModel.aggregate([
                {
                    $match: {
                        recipientUserId: new mongoose_2.Types.ObjectId(userId),
                        recipientType: database_enums_1.MessageRecipientType.FRIEND,
                        isRead: false,
                        senderUserId: { $in: friendIds },
                    },
                },
                {
                    $group: {
                        _id: '$senderUserId',
                        unreadCount: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        friendUserId: '$_id',
                        unreadCount: 1,
                    },
                },
            ]),
        ]);
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const unreadMap = new Map(unreadItems.map((item) => [String(item.friendUserId), item.unreadCount]));
        return users.map((user) => {
            const profile = profileMap.get(String(user._id));
            return {
                id: String(user._id),
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber,
                displayName: profile?.name ?? user.username,
                avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
                isOnline: friends_realtime_service_1.FriendsRealtimeService.isUserOnline(String(user._id)),
                unreadCount: unreadMap.get(String(user._id)) ?? 0,
            };
        });
    }
    async createSubscriptionCheckout(dto) {
        const user = await this.userModel.findById(dto.userId).lean();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const objectIds = dto.serviceIds.map(id => new mongoose_2.Types.ObjectId(id));
        const services = await this.contentServiceModel
            .find({ _id: { $in: objectIds }, isActive: true })
            .lean();
        const totalAmount = services.reduce((sum, s) => sum + (s.monthlyPrice ?? 0), 0);
        console.log('SERVICES:', services);
        console.log('TOTAL AMOUNT:', totalAmount);
        const txnRef = this.generateTxnRef();
        await this.paymentModel.create({
            userId: new mongoose_2.Types.ObjectId(dto.userId),
            provider: dto.provider,
            txnRef,
            amount: totalAmount,
            currency: this.vnpayCurrency,
            status: database_enums_1.PaymentStatus.PENDING,
            orderStatus: database_enums_1.OrderStatus.PENDING,
        });
        if (dto.provider === 'PAYPAL') {
            const order = await this.paypalService.createOrder(totalAmount, txnRef);
            const approvalLink = order.links.find((l) => l.rel === 'approve')?.href;
            return {
                paymentUrl: approvalLink,
                txnRef,
            };
        }
        if (dto.provider === 'VNPAY') {
            const paymentUrl = this.buildVnpayPaymentUrl({
                txnRef,
                amount: totalAmount,
                orderInfo: `Subscription order ${txnRef}`,
            });
            return {
                paymentUrl,
                txnRef,
            };
        }
        throw new common_1.BadRequestException('Invalid payment provider');
    }
    async handleVnpayReturn(query) {
        const redirectBase = `${this.frontendBaseUrl}/profile`;
        const secureHash = query.vnp_SecureHash;
        const txnRef = query.vnp_TxnRef;
        if (!secureHash || !txnRef) {
            return `${redirectBase}?payment=error`;
        }
        const signatureParams = { ...query };
        delete signatureParams.vnp_SecureHash;
        delete signatureParams.vnp_SecureHashType;
        const signedData = this.buildSortedQuery(signatureParams);
        const expectedHash = (0, crypto_1.createHmac)('sha512', this.vnpayHashSecret)
            .update(Buffer.from(signedData, 'utf-8'))
            .digest('hex');
        const payment = await this.paymentModel.findOne({ txnRef });
        if (!payment) {
            return `${redirectBase}?payment=error&txnRef=${encodeURIComponent(txnRef)}`;
        }
        if (expectedHash !== secureHash) {
            payment.status = database_enums_1.PaymentStatus.CANCELLED;
            payment.orderStatus = database_enums_1.OrderStatus.CANCELLED;
            payment.responseCode = '97';
            await payment.save();
            this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
            return `${redirectBase}?payment=invalid-signature&txnRef=${encodeURIComponent(txnRef)}`;
        }
        const isSuccessful = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
        if (!isSuccessful) {
            const isCancelled = query.vnp_ResponseCode === '24';
            payment.status = isCancelled ? database_enums_1.PaymentStatus.CANCELLED : database_enums_1.PaymentStatus.FAILED;
            payment.orderStatus = database_enums_1.OrderStatus.CANCELLED;
            payment.responseCode = query.vnp_ResponseCode || '99';
            await payment.save();
            this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
            return `${redirectBase}?payment=${isCancelled ? 'cancelled' : 'failed'}&txnRef=${encodeURIComponent(txnRef)}`;
        }
        payment.status = database_enums_1.PaymentStatus.SUCCESS;
        payment.orderStatus = database_enums_1.OrderStatus.PENDING;
        payment.responseCode = query.vnp_ResponseCode;
        payment.paidAt = new Date();
        await payment.save();
        await this.createPendingSubscriptions(payment.userId, payment.serviceTypes);
        this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
        return `${redirectBase}?payment=success&txnRef=${encodeURIComponent(txnRef)}`;
    }
    toPublicAssetUrl(path) {
        if (!path) {
            return '';
        }
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
    async createPendingSubscriptions(userId, serviceKeys) {
        const allowedServiceTypes = new Set(Object.values(database_enums_1.SubscriptionServiceType));
        const services = await this.contentServiceModel
            .find({ key: { $in: serviceKeys } })
            .select('key monthlyPrice')
            .lean();
        await Promise.all(services
            .filter((service) => allowedServiceTypes.has(service.key))
            .map((service) => this.serviceSubscriptionModel.updateOne({
            userId,
            serviceType: service.key,
        }, {
            $set: {
                status: database_enums_1.SubscriptionStatus.PENDING,
                priceAmount: service.monthlyPrice ?? 0,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                userId,
                serviceType: service.key,
                autoRenew: false,
                createdAt: new Date(),
            },
        }, { upsert: true })));
    }
    async handlePaypalReturn(orderId) {
        try {
            const capture = await this.paypalService.captureOrder(orderId);
            if (capture.status === 'COMPLETED') {
                await this.paymentModel.findOneAndUpdate({ txnRef: orderId }, {
                    status: database_enums_1.PaymentStatus.SUCCESS,
                    orderStatus: database_enums_1.OrderStatus.COMPLETED,
                    paidAt: new Date(),
                    responseCode: '00'
                });
                return 'http://localhost:4200/payment-success?status=success';
            }
            else {
                throw new Error('Thanh toán chưa hoàn tất');
            }
        }
        catch (error) {
            console.error('Lỗi PayPal Capture:', error);
            await this.paymentModel.findOneAndUpdate({ txnRef: orderId }, { status: database_enums_1.PaymentStatus.FAILED });
            return 'http://localhost:4200/payment-failed?status=failed';
        }
    }
    buildVnpayPaymentUrl(input) {
        const createDate = this.formatVnpayDate(new Date());
        const expireDate = this.formatVnpayDate(new Date(Date.now() + 15 * 60 * 1000));
        const returnUrl = `${this.backendBaseUrl}/api/home/subscriptions/vnpay-return`;
        const params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.vnpayTmnCode,
            vnp_Locale: this.vnpayLocale,
            vnp_CurrCode: this.vnpayCurrency,
            vnp_TxnRef: input.txnRef,
            vnp_OrderInfo: input.orderInfo,
            vnp_OrderType: this.vnpayOrderType,
            vnp_Amount: `${Math.round(input.amount * 100)}`,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: '127.0.0.1',
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };
        const signData = this.buildSortedQuery(params);
        const signature = (0, crypto_1.createHmac)('sha512', this.vnpayHashSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');
        return `${this.vnpayUrl}?${signData}&vnp_SecureHash=${signature}`;
    }
    buildSortedQuery(params) {
        return Object.keys(params)
            .sort()
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
            .join('&');
    }
    formatVnpayDate(date) {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        const hours = `${date.getHours()}`.padStart(2, '0');
        const minutes = `${date.getMinutes()}`.padStart(2, '0');
        const seconds = `${date.getSeconds()}`.padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    generateTxnRef() {
        return `SUB${Date.now()}${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
    }
};
exports.HomeService = HomeService;
exports.HomeService = HomeService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, mongoose_1.InjectModel)(content_service_schema_1.ContentService.name)),
    __param(4, (0, mongoose_1.InjectModel)(friendship_schema_1.Friendship.name)),
    __param(5, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(6, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(7, (0, mongoose_1.InjectModel)(service_subscription_schema_1.ServiceSubscription.name)),
    __param(8, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(9, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        friends_realtime_service_1.FriendsRealtimeService,
        payment_service_1.PaypalService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], HomeService);
//# sourceMappingURL=home.service.js.map