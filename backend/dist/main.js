"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const friends_realtime_service_1 = require("./friends/friends-realtime.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads',
    });
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3000);
    app.get(friends_realtime_service_1.FriendsRealtimeService).attach(app.getHttpServer());
}
bootstrap();
//# sourceMappingURL=main.js.map