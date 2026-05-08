import { Injectable } from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';
@Injectable()
export class PaypalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const environment = new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!,
    );
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(amountVND: number, txnRef: string) {
    // PayPal không hỗ trợ VND, chia cho 25000 để ra USD
    const amountUSD = (amountVND / parseFloat(process.env.VNPAY_EXCHANGE_RATE!)).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: txnRef, // Mã giao dịch của bạn
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
    return response.result; // Trả về thông tin đơn hàng (ID và Link)
  }

  // Hàm xác nhận đã thu tiền (Capture)
  async captureOrder(orderId: string) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await this.client.execute(request);
    return response.result;
  }
}