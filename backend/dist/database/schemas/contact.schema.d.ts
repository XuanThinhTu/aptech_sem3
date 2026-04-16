import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
export type ContactDocument = HydratedDocument<Contact>;
export declare class Contact {
    ownerUserId: Types.ObjectId;
    firstName: string;
    lastName?: string;
    contactNumber: string;
}
export declare const ContactSchema: MongooseSchema<Contact, import("mongoose").Model<Contact, any, any, any, any, any, Contact>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Contact, import("mongoose").Document<unknown, {}, Contact, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    ownerUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Contact, import("mongoose").Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    firstName?: import("mongoose").SchemaDefinitionProperty<string, Contact, import("mongoose").Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Contact, import("mongoose").Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    contactNumber?: import("mongoose").SchemaDefinitionProperty<string, Contact, import("mongoose").Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Contact>;
