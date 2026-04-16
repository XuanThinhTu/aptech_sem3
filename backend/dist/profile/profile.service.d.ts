import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Gender, MaritalStatus, WorkStatus } from '../database/enums/database.enums';
import { FriendshipDocument } from '../database/schemas/friendship.schema';
import { ProfileDocument } from '../database/schemas/profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class ProfileService {
    private readonly configService;
    private readonly friendshipModel;
    private readonly profileModel;
    private readonly userModel;
    private readonly uploadsRoot;
    private readonly profileUploadsRoot;
    private readonly defaultAvatarPath;
    private readonly backendBaseUrl;
    constructor(configService: ConfigService, friendshipModel: Model<FriendshipDocument>, profileModel: Model<ProfileDocument>, userModel: Model<UserDocument>);
    getProfile(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: import("../database/enums/database.enums").UserRole;
            displayName: string;
            avatarUrl: string;
        };
        profile: {
            name: string;
            gender: Gender;
            dob: string;
            address: string;
            maritalStatus: MaritalStatus;
            emailAddress: string;
            hobbies: string[];
            likes: string[];
            dislikes: string[];
            cuisines: string[];
            sports: string[];
            imageUrl: string;
            qualification: string;
            school: string;
            college: string;
            workStatus: WorkStatus;
            organization: string;
            designation: string;
        };
    }>;
    getFriendProfile(viewerUserId: string, friendUserId: string): Promise<{
        friend: {
            id: string;
            displayName: string;
            email: string;
            mobileNumber: string;
            avatarUrl: string;
        };
        profile: {
            name: string;
            gender: Gender;
            dob: string;
            address: string;
            maritalStatus: MaritalStatus;
            emailAddress: string;
            hobbies: string[];
            likes: string[];
            dislikes: string[];
            cuisines: string[];
            sports: string[];
            imageUrl: string;
            qualification: string;
            school: string;
            college: string;
            workStatus: WorkStatus;
            organization: string;
            designation: string;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto, avatarFile?: {
        path?: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: import("../database/enums/database.enums").UserRole;
            displayName: string;
            avatarUrl: string;
        };
        profile: {
            name: string;
            gender: Gender;
            dob: string;
            address: string;
            maritalStatus: MaritalStatus;
            emailAddress: string;
            hobbies: string[];
            likes: string[];
            dislikes: string[];
            cuisines: string[];
            sports: string[];
            imageUrl: string;
            qualification: string;
            school: string;
            college: string;
            workStatus: WorkStatus;
            organization: string;
            designation: string;
        };
    }>;
    updateAvatar(userId: string, avatarFile?: {
        path?: string;
    }): Promise<{
        message: string;
        imageUrl: string;
    }>;
    private findUser;
    private createEmptyProfile;
    private serializeProfile;
    private toPublicAssetUrl;
    private toRelativeUploadPath;
    private deleteStoredImage;
    private deleteUploadedFile;
    private toSafeUser;
}
