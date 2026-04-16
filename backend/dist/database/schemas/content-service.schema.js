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
exports.ContentServiceSchema = exports.ContentService = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ContentService = class ContentService {
    key;
    name;
    description;
    imageUrl;
    monthlyPrice;
    isActive;
};
exports.ContentService = ContentService;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, lowercase: true, unique: true, maxlength: 80 }),
    __metadata("design:type", String)
], ContentService.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 120 }),
    __metadata("design:type", String)
], ContentService.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 255 }),
    __metadata("design:type", String)
], ContentService.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ContentService.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], ContentService.prototype, "monthlyPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], ContentService.prototype, "isActive", void 0);
exports.ContentService = ContentService = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'services',
        timestamps: true,
    })
], ContentService);
exports.ContentServiceSchema = mongoose_1.SchemaFactory.createForClass(ContentService);
//# sourceMappingURL=content-service.schema.js.map