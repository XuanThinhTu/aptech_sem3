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
exports.UpdateProfileDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const database_enums_1 = require("../../database/enums/database.enums");
function parseStringArray(value) {
    if (Array.isArray(value)) {
        return value.map((item) => `${item}`.trim()).filter(Boolean);
    }
    if (typeof value !== 'string') {
        return [];
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => `${item}`.trim()).filter(Boolean);
        }
    }
    catch {
        return trimmed
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}
function emptyToUndefined(value) {
    if (typeof value !== 'string') {
        return value;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
class UpdateProfileDto {
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
    qualification;
    school;
    college;
    workStatus;
    organization;
    designation;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(database_enums_1.Gender),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateProfileDto.prototype, "dob", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(database_enums_1.MaritalStatus),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "maritalStatus", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "emailAddress", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "hobbies", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "likes", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "dislikes", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "cuisines", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "sports", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "qualification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "school", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "college", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(database_enums_1.WorkStatus),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "workStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "organization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "designation", void 0);
//# sourceMappingURL=update-profile.dto.js.map