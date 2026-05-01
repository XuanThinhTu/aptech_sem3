export declare class PaypalService {
    private client;
    constructor();
    createOrder(amountVND: number, txnRef: string): Promise<any>;
    captureOrder(orderId: string): Promise<any>;
}
