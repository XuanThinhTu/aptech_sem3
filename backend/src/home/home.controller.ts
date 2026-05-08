// import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
// import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
// import { HomeService } from './home.service';

// @Controller('home')
// export class HomeController {
//   constructor(private readonly homeService: HomeService) {}

//   @Get('services')
//   getServices() {
//     return this.homeService.getServices();
//   }
  

//   @Get('friends')
//   getFriends(@Query('userId') userId: string) {
//     return this.homeService.getFriends(userId);
//   }

//   // @Post('subscriptions/checkout')
//   // createSubscriptionCheckout(@Body() dto: CreateSubscriptionCheckoutDto) {
//   //   return this.homeService.createSubscriptionCheckout(dto);
//   // }


//   // @Get('subscriptions/vnpay-return')
//   // async handleVnpayReturn(@Query() query: Record<string, string>, @Res() res: any) {
//   //   const redirectUrl = await this.homeService.handleVnpayReturn(query);
//   //   return res.redirect(redirectUrl);
//   // }
//   // home.controller.ts

// @Post('subscriptions/checkout')
// createSubscriptionCheckout(@Body() dto: CreateSubscriptionCheckoutDto) {
//   return this.homeService.createSubscriptionCheckout(dto);
// }

// @Get('subscriptions/paypal-return')
// async handlePaypalReturn(
//   @Query('token') token: string, 
//   @Res() res: any
// ) {
//   if (!token) {
//     return res.redirect('http://localhost:4200/profile?payment=error');
//   }
//   const redirectUrl = await this.homeService.handlePaypalReturn(token);
//   return res.redirect(redirectUrl);
// }
// }
// home.controller.ts
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { HomeService } from './home.service';
import { PaypalService } from '../payments/payment.service'; // Đảm bảo đúng đường dẫn tới PaypalService của bạn

@Controller('home')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly paypalService: PaypalService // Inject PaypalService vào đây
  ) {}

  @Get('services')
  getServices() {
    return this.homeService.getServices();
  }

  @Get('friends')
  getFriends(@Query('userId') userId: string) {
    return this.homeService.getFriends(userId);
  }

@Post('subscriptions/checkout')
createSubscriptionCheckout(@Body() dto: CreateSubscriptionCheckoutDto) {
  return this.homeService.createSubscriptionCheckout(dto);
}

  @Get('subscriptions/vnpay-return')
  async handleVnpayReturn(@Query() query: Record<string, string>, @Res() res: any) {
    const redirectUrl = await this.homeService.handleVnpayReturn(query);
    return res.redirect(redirectUrl);
  }

  @Get('subscriptions/paypal-return')
  async handlePaypalReturn(
    @Query('token') token: string, 
    @Res() res: any
  ) {
    if (!token) {
      return res.redirect('http://localhost:4200/profile?payment=error');
    }
    const redirectUrl = await this.homeService.handlePaypalReturn(token);
    return res.redirect(redirectUrl);
  }
  @Get('subscriptions/history')
  async getSubscriptionHistory(@Query('userId') userId: string) {
    return this.homeService.getSubscriptionHistory(userId);
  }
}