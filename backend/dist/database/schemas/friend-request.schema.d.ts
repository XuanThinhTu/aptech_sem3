import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { FriendRequestStatus } from '../enums/database.enums';
export type FriendRequestDocument = HydratedDocument<FriendRequest>;
export declare class FriendRequest {
    senderUserId: Types.ObjectId;
    receiverUserId: Types.ObjectId;
    receiverEmail: string;
    status: FriendRequestStatus;
    respondedAt?: Date;
}
export declare const FriendRequestSchema: MongooseSchema<FriendRequest, import("mongoose").Model<FriendRequest, any, any, any, any, any, FriendRequest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    senderUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverEmail?: import("mongoose").SchemaDefinitionProperty<string, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<FriendRequestStatus, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    respondedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, FriendRequest, import("mongoose").Document<unknown, {}, FriendRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FriendRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, FriendRequest>;
