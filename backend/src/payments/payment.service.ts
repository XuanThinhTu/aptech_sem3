import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as paypal from '@paypal/checkout-server-sdk';
import { ServiceSubscription, ServiceSubscriptionDocument } from '../database/schemas/service-subscription.schema';
import { ContentService, ContentServiceDocument } from '../database/schemas/content-service.schema';
import { OrderStatus, PaymentStatus, SubscriptionStatus } from '../database/enums/database.enums';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class PaypalService {
  private client: paypal.core.PayPalHttpClient;

  constructor(
    @InjectModel('Payment') 
    private readonly paymentModel: Model<any>,
    @InjectModel(ServiceSubscription.name) 
    private readonly subscriptionModel: Model<ServiceSubscriptionDocument>,
    @InjectModel(ContentService.name) 
    private readonly contentServiceModel: Model<ContentServiceDocument>,
    private readonly chatService: ChatService,
  ) {
    const environment = new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!,
    );
    this.client = new paypal.core.PayPalHttpClient(environment);
  }
async createOrder(amountVND: number, txnRef: string, userId: string, serviceTypes: any) {
    
    const existingSubscription = await this.paymentModel.findOne({
      userId: new Types.ObjectId(userId),
      serviceTypes: { $all: Array.isArray(serviceTypes) ? serviceTypes : [serviceTypes] },
      status: PaymentStatus.SUCCESS, 
      orderStatus: OrderStatus.COMPLETED
    });

    if (existingSubscription) {
      console.log('--- ĐÃ TÌM THẤY ĐƠN TRÙNG, ĐANG CHẶN ---');
      
      await this.chatService.sendMessage(
        '69e219439a52b345c0c82898', 
        userId, 
        `Hệ thống: Gói dịch vụ này bạn đã sở hữu. Vui lòng không thanh toán trùng!`
      );
      throw new BadRequestException('ALREADY_OWNED');
    }

    const amountUSD = (amountVND / parseFloat(process.env.VNPAY_EXCHANGE_RATE!)).toFixed(2);
    const request = new paypal.orders.OrdersCreateRequest();
    
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: txnRef,
          amount: {
            currency_code: 'USD',
            value: amountUSD,
          },
        },
      ],
      application_context: {
        brand_name: 'My Service App',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: 'http://localhost:3000/api/home/subscriptions/paypal-return',
        cancel_url: 'http://localhost:4200/profile?payment=cancelled',
      },
    });

    const response = await this.client.execute(request);
    const result = response.result;

    await this.paymentModel.create({
      userId: new Types.ObjectId(userId),
      provider: 'PAYPAL',
      txnRef: result.id, 
      amount: amountVND,
      currency: 'VND',
      status: 'pending',
      serviceTypes: serviceTypes,
      orderStatus: 'pending',
      createdAt: new Date(),
    });

    return result;
}
async captureOrder(orderId: string, userId: string, serviceType: any, amountVND: number) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    
    const response = await this.client.execute(request);
    const result = response.result;

    if (result.status === 'COMPLETED') {
      await this.handleSuccessfulSubscription(
        userId, 
        orderId, 
        serviceType, 
        amountVND
      );
    }

    return result;
  }

  async handleSuccessfulSubscription(
  userId: string, 
  orderId: string, 
  serviceType: any, 
  amountVND: number,
  selectedTime: string = '08:00' 
) {
  await this.paymentModel.findOneAndUpdate(
    { txnRef: orderId },
    {
      status: 'success',
      orderStatus: 'completed',
      paidAt: new Date(),
    },
    { upsert: true }
  );

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  const sub = await this.subscriptionModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), serviceType: serviceType },
    {
      status: SubscriptionStatus.ACTIVE,
      activatedAt: new Date(),
      expiresAt: expiryDate,
      priceAmount: amountVND,
      scheduledTime: selectedTime, 
      isAutoSendEnabled: true,
    },
    { upsert: true, new: true }
  );

  try {
    await this.chatService.sendWelcomeServiceMessage(userId, serviceType);
  } catch (error) {
    console.error('Lỗi gửi tin nhắn chào mừng:', error);
  }

  return sub;
}

  async activateSubscriptionsFromPayment(paymentData: any) {
    if (paymentData.status !== 'success' || paymentData.orderStatus !== 'completed') {
      return;
    }

    const { userId, serviceTypes, amount } = paymentData;
    const results = [];

    for (const type of serviceTypes) {
      const serviceInfo = await this.contentServiceModel.findOne({ 
        $or: [{ key: type }, { name: type }] 
      });
      
      const finalPrice = serviceInfo ? serviceInfo.monthlyPrice : (amount / serviceTypes.length);
      const serviceName = serviceInfo ? serviceInfo.name : type; 
      
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const sub = await this.subscriptionModel.findOneAndUpdate(
        { 
          userId: new Types.ObjectId(userId), 
          serviceType: type 
        },
        {
          status: SubscriptionStatus.ACTIVE,
          activatedAt: new Date(),
          expiresAt: expiryDate,
          priceAmount: finalPrice,
          scheduledTime: '08:00',
          isAutoSendEnabled: true,
        },
        { upsert: true, new: true }
      );

      try {
        await this.chatService.sendWelcomeServiceMessage(userId.toString(), serviceName);
      } catch (error) {
        console.error('Lỗi gửi tin nhắn chào mừng:', error);
      }

      results.push(sub);
    }

    return results;
  }
  
}