import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
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
            gender: import("../database/enums/database.enums").Gender;
            dob: string;
            address: string;
            maritalStatus: import("../database/enums/database.enums").MaritalStatus;
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
            workStatus: import("../database/enums/database.enums").WorkStatus;
            organization: string;
            designation: string;
        };
    }>;
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
            gender: import("../database/enums/database.enums").Gender;
            dob: string;
            address: string;
            maritalStatus: import("../database/enums/database.enums").MaritalStatus;
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
            workStatus: import("../database/enums/database.enums").WorkStatus;
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
            gender: import("../database/enums/database.enums").Gender;
            dob: string;
            address: string;
            maritalStatus: import("../database/enums/database.enums").MaritalStatus;
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
            workStatus: import("../database/enums/database.enums").WorkStatus;
            organization: string;
            designation: string;
        };
    }>;
}
