import { Gender, MaritalStatus, WorkStatus } from '../../database/enums/database.enums';
export declare class UpdateProfileDto {
    name: string;
    gender: Gender;
    dob: Date;
    address: string;
    maritalStatus: MaritalStatus;
    emailAddress: string;
    hobbies: string[];
    likes: string[];
    dislikes: string[];
    cuisines: string[];
    sports: string[];
    qualification?: string;
    school?: string;
    college?: string;
    workStatus: WorkStatus;
    organization?: string;
    designation?: string;
}
