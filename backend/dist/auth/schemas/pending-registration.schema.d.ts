import { HydratedDocument } from 'mongoose';
export type PendingRegistrationDocument = HydratedDocument<PendingRegistration>;
export declare class PendingRegistration {
    username: string;
    email: string;
    mobileNumber: string;
    passwordHash: string;
    otpCode: string;
    expiresAt: Date;
    attempts: number;
}
export declare const PendingRegistrationSchema: import("mongoose").Schema<PendingRegistration, import("mongoose").Model<PendingRegistration, any, any, any, any, any, PendingRegistration>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    username?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mobileNumber?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    passwordHash?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otpCode?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attempts?: import("mongoose").SchemaDefinitionProperty<number, PendingRegistration, import("mongoose").Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PendingRegistration>;
