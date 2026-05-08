import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, randomBytes } from 'crypto';
import { Error, Model, Types } from 'mongoose';
import { PaypalService } from '../payments/payment.service';
import {
  OrderStatus,
  MessageRecipientType,
  PaymentProvider,
  PaymentStatus,
  SubscriptionServiceType,
  SubscriptionStatus,
} from '../database/enums/database.enums';
import { ContentService } from '../database/schemas/content-service.schema';
import { Friendship } from '../database/schemas/friendship.schema';
import { Message } from '../database/schemas/message.schema';
import { Payment } from '../database/schemas/payment.schema';
import { Profile } from '../database/schemas/profile.schema';
import { ServiceSubscription } from '../database/schemas/service-subscription.schema';
import { User } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';

@Injectable()
export class HomeService {
  [x: string]: any;

  private readonly backendBaseUrl: string;
  private readonly frontendBaseUrl: string;
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';
  private readonly vnpayUrl: string;
  private readonly vnpayTmnCode: string;
  private readonly vnpayHashSecret: string;
  private readonly vnpayOrderType: string;
  private readonly vnpayLocale: string;
  private readonly vnpayCurrency: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly friendsRealtimeService: FriendsRealtimeService,
    private readonly paypalService: PaypalService,
    @InjectModel(ContentService.name)
    private readonly contentServiceModel: Model<ContentService>,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<Friendship>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(ServiceSubscription.name)
    private readonly serviceSubscriptionModel: Model<ServiceSubscription>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<Profile>,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
    this.frontendBaseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ?? 'http://127.0.0.1:4200';
    this.vnpayUrl =
      this.configService.get<string>('VNPAY_URL') ??
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnpayTmnCode = this.configService.get<string>('VNPAY_TMN_CODE') ?? '';
    this.vnpayHashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') ?? '';
    this.vnpayOrderType = this.configService.get<string>('VNPAY_ORDER_TYPE') ?? 'Bill Payment';
    this.vnpayLocale = this.configService.get<string>('VNPAY_LOCALE') ?? 'vn';
    this.vnpayCurrency = this.configService.get<string>('VNPAY_CURRENCY') ?? 'VND';
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

  async getFriends(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const friendships = await this.friendshipModel
      .find({ userId: new Types.ObjectId(userId) })
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
      this.messageModel.aggregate<{
        friendUserId: Types.ObjectId;
        unreadCount: number;
      }>([
        {
          $match: {
            recipientUserId: new Types.ObjectId(userId),
            recipientType: MessageRecipientType.FRIEND,
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

    const profileMap = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );
    const unreadMap = new Map(
      unreadItems.map((item) => [String(item.friendUserId), item.unreadCount]),
    );

    return users.map((user) => {
      const profile = profileMap.get(String(user._id));
      return {
        id: String(user._id),
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        displayName: profile?.name ?? user.username,
        avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
        isOnline: FriendsRealtimeService.isUserOnline(String(user._id)),
        unreadCount: unreadMap.get(String(user._id)) ?? 0,
      };
    });
  }

  // async createSubscriptionCheckout(dto: CreateSubscriptionCheckoutDto) {
  //   if (!this.vnpayTmnCode || !this.vnpayHashSecret) {
  //     throw new BadRequestException('VNPAY is not configured yet.');
  //   }

  //   const user = await this.userModel.findById(dto.userId).lean();
  //   if (!user) {
  //     throw new NotFoundException('User not found.');
  //   }

  //   const objectIds = dto.serviceIds.map((serviceId) => new Types.ObjectId(serviceId));
  //   const services = await this.contentServiceModel
  //     .find({ _id: { $in: objectIds }, isActive: true })
  //     .lean();

  //   if (services.length !== dto.serviceIds.length) {
  //     throw new BadRequestException('One or more selected services are unavailable.');
  //   }

  //   const totalAmount = services.reduce((sum, service) => sum + (service.monthlyPrice ?? 0), 0);
  //   if (!totalAmount) {
  //     throw new BadRequestException('The selected services do not have a valid total amount.');
  //   }

  //   const txnRef = this.generateTxnRef();
  //   const serviceKeys = services.map((service) => service.key);
  //   const serviceNames = services.map((service) => service.name);

  //   await this.paymentModel.create({
  //     userId: new Types.ObjectId(dto.userId),
  //     provider: PaymentProvider.VNPAY,
  //     txnRef,
  //     amount: totalAmount,
  //     currency: this.vnpayCurrency,
  //     status: PaymentStatus.PENDING,
  //     orderStatus: OrderStatus.PENDING,
  //     serviceTypes: serviceKeys,
  //     orderInfo: `Subscription order: ${serviceNames.join(', ')}`,
  //     responseCode: 'INIT',
  //   });

  //   const paymentUrl = this.buildVnpayPaymentUrl({
  //     txnRef,
  //     amount: totalAmount,
  //     orderInfo: `Subscription order ${txnRef}`,
  //   });

  //   return {
  //     paymentUrl,
  //     txnRef,
  //   };
  // }
async createSubscriptionCheckout(dto: CreateSubscriptionCheckoutDto) {
  const user = await this.userModel.findById(dto.userId).lean();
  if (!user) {
    throw new NotFoundException('User not found.');
  }

  const objectIds = dto.serviceIds.map(id => new Types.ObjectId(id));
  const services = await this.contentServiceModel
    .find({ _id: { $in: objectIds }, isActive: true })
    .lean();

  if (!services || services.length === 0) {
    throw new BadRequestException('No valid services selected.');
  }

  const totalAmount = services.reduce((sum, s) => sum + (s.monthlyPrice ?? 0), 0);
  
  if (totalAmount <= 0) {
    throw new BadRequestException('Total amount must be greater than 0.');
  }

  const txnRef = this.generateTxnRef();

  await this.paymentModel.create({
    userId: new Types.ObjectId(dto.userId),
    provider: dto.provider as PaymentProvider,
    txnRef,
    amount: totalAmount,
    currency: this.vnpayCurrency || 'VND',
    status: PaymentStatus.PENDING,
    orderStatus: OrderStatus.PENDING,
    serviceTypes: services.map(s => s.key),
    orderInfo: `Buy: ${services.map(s => s.name).join(', ')}`,
  });

  if (dto.provider === 'PAYPAL') {
    const order = await this.paypalService.createOrder(totalAmount, txnRef);
    const approvalLink = order.links.find((l: any) => l.rel === 'approve')?.href;

    if (!approvalLink) {
      throw new Error('PayPal link generation failed.');
    }

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

  throw new BadRequestException('Invalid payment provider');
}
  async handleVnpayReturn(query: Record<string, string>) {
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
    const expectedHash = createHmac('sha512', this.vnpayHashSecret)
      .update(Buffer.from(signedData, 'utf-8'))
      .digest('hex');

    const payment = await this.paymentModel.findOne({ txnRef });
    if (!payment) {
      return `${redirectBase}?payment=error&txnRef=${encodeURIComponent(txnRef)}`;
    }

    if (expectedHash !== secureHash) {
      payment.status = PaymentStatus.CANCELLED;
      payment.orderStatus = OrderStatus.CANCELLED;
      payment.responseCode = '97';
      await payment.save();
      this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
      return `${redirectBase}?payment=invalid-signature&txnRef=${encodeURIComponent(txnRef)}`;
    }

    const isSuccessful =
      query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';

    if (!isSuccessful) {
      const isCancelled = query.vnp_ResponseCode === '24';
      payment.status = isCancelled ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
      payment.orderStatus = OrderStatus.CANCELLED;
      payment.responseCode = query.vnp_ResponseCode || '99';
      await payment.save();
      this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
      return `${redirectBase}?payment=${isCancelled ? 'cancelled' : 'failed'}&txnRef=${encodeURIComponent(txnRef)}`;
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.orderStatus = OrderStatus.PENDING;
    payment.responseCode = query.vnp_ResponseCode;
    payment.paidAt = new Date();
    await payment.save();

    await this.createPendingSubscriptions(payment.userId, payment.serviceTypes);
    this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');

    return `${redirectBase}?payment=success&txnRef=${encodeURIComponent(txnRef)}`;
  }

  private toPublicAssetUrl(path?: string) {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async createPendingSubscriptions(userId: Types.ObjectId, serviceKeys: string[]) {
    const allowedServiceTypes = new Set<string>(Object.values(SubscriptionServiceType));
    const services = await this.contentServiceModel
      .find({ key: { $in: serviceKeys } })
      .select('key monthlyPrice')
      .lean();

    await Promise.all(
      services
        .filter((service) => allowedServiceTypes.has(service.key))
        .map((service) =>
          this.serviceSubscriptionModel.updateOne(
            {
              userId,
              serviceType: service.key as SubscriptionServiceType,
            },
            {
              $set: {
                status: SubscriptionStatus.PENDING,
                priceAmount: service.monthlyPrice ?? 0,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                userId,
                serviceType: service.key as SubscriptionServiceType,
                autoRenew: false,
                createdAt: new Date(),
              },
            },
            { upsert: true },
          ),
        ),
    );
  }
  

async handlePaypalReturn(orderId: string): Promise<string> {
  try {
    const capture = await this.paypalService.captureOrder(orderId);

    if (capture.status === 'COMPLETED') {
      await this.paymentModel.findOneAndUpdate(
        { txnRef: orderId },
        { 
          status: PaymentStatus.SUCCESS,
          orderStatus: OrderStatus.COMPLETED,
          paidAt: new Date(),
          responseCode: '00' 
        }
      );

      
      return 'http://localhost:4200/payment-success?status=success';
    } else {
      throw new Error('Thanh toán chưa hoàn tất');
    }
  } catch (error) {
    console.error('Lỗi PayPal Capture:', error);
    
    await this.paymentModel.findOneAndUpdate(
      { txnRef: orderId },
      { status: PaymentStatus.FAILED }
    );
    
    return 'http://localhost:4200/payment-failed?status=failed';
  }
}

  private buildVnpayPaymentUrl(input: {
    txnRef: string;
    amount: number;
    orderInfo: string;
  }) {
    const createDate = this.formatVnpayDate(new Date());
    const expireDate = this.formatVnpayDate(new Date(Date.now() + 15 * 60 * 1000));
    const returnUrl = `${this.backendBaseUrl}/api/home/subscriptions/vnpay-return`;
    const params: Record<string, string> = {
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
    const signature = createHmac('sha512', this.vnpayHashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return `${this.vnpayUrl}?${signData}&vnp_SecureHash=${signature}`;
  }

  private buildSortedQuery(params: Record<string, string>) {
    return Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`,
      )
      .join('&');
  }

    async getOrderDetail(orderId: string, userId: string) {
      const order = await this.paymentModel.findOne({
        _id: orderId,
        userId: userId 
      });
      
      if (!order) throw new NotFoundException('Không tìm thấy hóa đơn');
      return order;
    }
      
  private formatVnpayDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private generateTxnRef() {
    return `SUB${Date.now()}${randomBytes(3).toString('hex').toUpperCase()}`;
  }
  async getSubscriptionHistory(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestException('Invalid User ID');
  }
  

  const payments = await this.paymentModel
    .find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return payments.map((payment: any) => ({
    id: String(payment._id),
    txnRef: payment.txnRef,
    serviceTitle: payment.orderInfo || `Thanh toán qua ${payment.provider}`,
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.createdAt ? payment.createdAt.toISOString() : new Date().toISOString(),
  }));
}
}
