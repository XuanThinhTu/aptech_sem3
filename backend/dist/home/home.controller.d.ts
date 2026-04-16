import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { HomeService } from './home.service';
export declare class HomeController {
    private readonly homeService;
    constructor(homeService: HomeService);
    getServices(): Promise<{
        id: string;
        key: string;
        title: string;
        description: string;
        imageUrl: string;
        monthlyPrice: number;
    }[]>;
    getFriends(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        mobileNumber: string;
        displayName: string;
        avatarUrl: string;
        isOnline: boolean;
        unreadCount: number;
    }[]>;
    createSubscriptionCheckout(dto: CreateSubscriptionCheckoutDto): Promise<{
        paymentUrl: string;
        txnRef: string;
    }>;
    handleVnpayReturn(query: Record<string, string>, res: any): Promise<any>;
}
