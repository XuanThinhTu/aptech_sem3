import { HydratedDocument } from 'mongoose';
export type ContentServiceDocument = HydratedDocument<ContentService>;
export declare class ContentService {
    key: string;
    name: string;
    description: string;
    imageUrl: string;
    monthlyPrice: number;
    isActive: boolean;
}
export declare const ContentServiceSchema: import("mongoose").Schema<ContentService, import("mongoose").Model<ContentService, any, any, any, any, any, ContentService>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    imageUrl?: import("mongoose").SchemaDefinitionProperty<string, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    monthlyPrice?: import("mongoose").SchemaDefinitionProperty<number, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, ContentService, import("mongoose").Document<unknown, {}, ContentService, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContentService & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ContentService>;
