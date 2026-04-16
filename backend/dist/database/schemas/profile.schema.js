"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileSchema = exports.Profile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../enums/database.enums");
const user_schema_1 = require("./user.schema");
let Profile = class Profile {
    userId;
    name;
    gender;
    dob;
    address;
    maritalStatus;
    emailAddress;
    hobbies;
    likes;
    dislikes;
    cuisines;
    sports;
    imageUrl;
    qualification;
    school;
    college;
    workStatus;
    organization;
    designation;
};
exports.Profile = Profile;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Profile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.Gender, default: database_enums_1.Gender.MALE }),
    __metadata("design:type", String)
], Profile.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Profile.prototype, "dob", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 255 }),
    __metadata("design:type", String)
], Profile.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.MaritalStatus, default: database_enums_1.MaritalStatus.SINGLE }),
    __metadata("design:type", String)
], Profile.prototype, "maritalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, lowercase: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "emailAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Profile.prototype, "hobbies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Profile.prototype, "likes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Profile.prototype, "dislikes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Profile.prototype, "cuisines", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Profile.prototype, "sports", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Profile.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "qualification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "school", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "college", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: database_enums_1.WorkStatus, default: database_enums_1.WorkStatus.STUDENT }),
    __metadata("design:type", String)
], Profile.prototype, "workStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], Profile.prototype, "designation", void 0);
exports.Profile = Profile = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'profiles',
        timestamps: true,
    })
], Profile);
exports.ProfileSchema = mongoose_1.SchemaFactory.createForClass(Profile);
//# sourceMappingURL=profile.schema.js.map