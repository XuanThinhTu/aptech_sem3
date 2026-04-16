import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { SubscriptionServiceType, SubscriptionStatus } from '../enums/database.enums';
export type ServiceSubscriptionDocument = HydratedDocument<ServiceSubscription>;
export declare class ServiceSubscription {
    userId: Types.ObjectId;
    serviceType: SubscriptionServiceType;
    status: SubscriptionStatus;
    autoRenew: boolean;
    activatedAt?: Date;
    expiresAt?: Date;
    priceAmount: number;
}
export declare const ServiceSubscriptionSchema: MongooseSchema<ServiceSubscription, import("mongoose").Model<ServiceSubscription, any, any, any, any, any, ServiceSubscription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceType?: import("mongoose").SchemaDefinitionProperty<SubscriptionServiceType, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<SubscriptionStatus, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    autoRenew?: import("mongoose").SchemaDefinitionProperty<boolean, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    activatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    priceAmount?: import("mongoose").SchemaDefinitionProperty<number, ServiceSubscription, import("mongoose").Document<unknown, {}, ServiceSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ServiceSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ServiceSubscription>;
