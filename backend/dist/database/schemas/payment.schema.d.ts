import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderStatus, PaymentProvider, PaymentStatus } from '../enums/database.enums';
export type PaymentDocument = HydratedDocument<Payment>;
export declare class Payment {
    userId: Types.ObjectId;
    provider: PaymentProvider;
    txnRef: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    orderStatus: OrderStatus;
    serviceTypes: string[];
    orderInfo?: string;
    responseCode?: string;
    paidAt?: Date;
}
export declare const PaymentSchema: MongooseSchema<Payment, import("mongoose").Model<Payment, any, any, any, any, any, Payment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, import("mongoose").Document<unknown, {}, Payment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<PaymentProvider, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    txnRef?: import("mongoose").SchemaDefinitionProperty<string, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<PaymentStatus, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    orderStatus?: import("mongoose").SchemaDefinitionProperty<OrderStatus, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceTypes?: import("mongoose").SchemaDefinitionProperty<string[], Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    orderInfo?: import("mongoose").SchemaDefinitionProperty<string | undefined, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    responseCode?: import("mongoose").SchemaDefinitionProperty<string | undefined, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paidAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Payment, import("mongoose").Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Payment>;
