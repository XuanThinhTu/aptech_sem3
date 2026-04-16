import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

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
}
