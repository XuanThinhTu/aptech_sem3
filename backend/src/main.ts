import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { FriendsRealtimeService } from './friends/friends-realtime.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
  app.get(FriendsRealtimeService).attach(app.getHttpServer());
}
bootstrap();
