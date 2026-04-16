import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { MessageDeliveryStatus, MessageRecipientType } from '../enums/database.enums';
export type MessageDocument = HydratedDocument<Message>;
export declare class Message {
    senderUserId: Types.ObjectId;
    recipientUserId?: Types.ObjectId;
    recipientPhoneNumber: string;
    recipientName?: string;
    content: string;
    recipientType: MessageRecipientType;
    isFree: boolean;
    chargeAmount: number;
    countedAgainstDailyFreeLimit: boolean;
    deliveryStatus: MessageDeliveryStatus;
    isRead: boolean;
    readAt?: Date;
    sentAt?: Date;
}
export declare const MessageSchema: MongooseSchema<Message, import("mongoose").Model<Message, any, any, any, any, any, Message>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, import("mongoose").Document<unknown, {}, Message, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    senderUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recipientUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recipientPhoneNumber?: import("mongoose").SchemaDefinitionProperty<string, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recipientName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<string, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recipientType?: import("mongoose").SchemaDefinitionProperty<MessageRecipientType, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isFree?: import("mongoose").SchemaDefinitionProperty<boolean, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    chargeAmount?: import("mongoose").SchemaDefinitionProperty<number, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    countedAgainstDailyFreeLimit?: import("mongoose").SchemaDefinitionProperty<boolean, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveryStatus?: import("mongoose").SchemaDefinitionProperty<MessageDeliveryStatus, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isRead?: import("mongoose").SchemaDefinitionProperty<boolean, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, import("mongoose").Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Message>;
