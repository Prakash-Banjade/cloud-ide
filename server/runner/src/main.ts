import { NestFactory } from '@nestjs/core';
import { RunnerModule } from './runner.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(RunnerModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );

  const PORT = 3003;
  await app.listen(PORT);
  console.log(`Runner listening on ${await app.getUrl()}`);
}

bootstrap();
