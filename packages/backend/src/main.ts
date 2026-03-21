import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://fb.deintrid.de',
      'http://localhost:3003',
      'http://localhost:5173',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Fahrtenbuch backend running on port ${port}`);
}
bootstrap();
