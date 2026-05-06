import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
export type ConversationDocument = HydratedDocument<Conversation>;
export declare class Conversation {
    title: string;
    memberIds: Types.ObjectId[];
    adminId: Types.ObjectId;
    isGroup: boolean;
    groupAvatar?: string;
}
export declare const ConversationSchema: MongooseSchema<Conversation, import("mongoose").Model<Conversation, any, any, any, any, any, Conversation>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Conversation, import("mongoose").Document<unknown, {}, Conversation, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    title?: import("mongoose").SchemaDefinitionProperty<string, Conversation, import("mongoose").Document<unknown, {}, Conversation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    memberIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Conversation, import("mongoose").Document<unknown, {}, Conversation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Conversation, import("mongoose").Document<unknown, {}, Conversation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isGroup?: import("mongoose").SchemaDefinitionProperty<boolean, Conversation, import("mongoose").Document<unknown, {}, Conversation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    groupAvatar?: import("mongoose").SchemaDefinitionProperty<string | undefined, Conversation, import("mongoose").Document<unknown, {}, Conversation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Conversation>;
