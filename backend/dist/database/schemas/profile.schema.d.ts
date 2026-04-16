import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Gender, MaritalStatus, WorkStatus } from '../enums/database.enums';
export type ProfileDocument = HydratedDocument<Profile>;
export declare class Profile {
    userId: Types.ObjectId;
    name?: string;
    gender?: Gender;
    dob?: Date;
    address?: string;
    maritalStatus: MaritalStatus;
    emailAddress?: string;
    hobbies: string[];
    likes: string[];
    dislikes: string[];
    cuisines: string[];
    sports: string[];
    imageUrl?: string;
    qualification?: string;
    school?: string;
    college?: string;
    workStatus: WorkStatus;
    organization?: string;
    designation?: string;
}
export declare const ProfileSchema: MongooseSchema<Profile, import("mongoose").Model<Profile, any, any, any, any, any, Profile>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Profile, import("mongoose").Document<unknown, {}, Profile, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    gender?: import("mongoose").SchemaDefinitionProperty<Gender | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dob?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maritalStatus?: import("mongoose").SchemaDefinitionProperty<MaritalStatus, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    emailAddress?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hobbies?: import("mongoose").SchemaDefinitionProperty<string[], Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    likes?: import("mongoose").SchemaDefinitionProperty<string[], Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dislikes?: import("mongoose").SchemaDefinitionProperty<string[], Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cuisines?: import("mongoose").SchemaDefinitionProperty<string[], Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sports?: import("mongoose").SchemaDefinitionProperty<string[], Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    imageUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    qualification?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    school?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    college?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    workStatus?: import("mongoose").SchemaDefinitionProperty<WorkStatus, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    organization?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    designation?: import("mongoose").SchemaDefinitionProperty<string | undefined, Profile, import("mongoose").Document<unknown, {}, Profile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Profile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Profile>;
