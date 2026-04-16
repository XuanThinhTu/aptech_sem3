import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
export type FriendshipDocument = HydratedDocument<Friendship>;
export declare class Friendship {
    userId: Types.ObjectId;
    friendUserId: Types.ObjectId;
    becameFriendsAt?: Date;
}
export declare const FriendshipSchema: MongooseSchema<Friendship, import("mongoose").Model<Friendship, any, any, any, any, any, Friendship>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Friendship, import("mongoose").Document<unknown, {}, Friendship, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Friendship, import("mongoose").Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    friendUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Friendship, import("mongoose").Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    becameFriendsAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Friendship, import("mongoose").Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Friendship>;
