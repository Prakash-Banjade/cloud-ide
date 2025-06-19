import { NestFactory } from '@nestjs/core';
import { PtyModule } from './pty.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(PtyModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow<string>('CLIENT_URL'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  const PORT = 3004;
  await app.listen(PORT);
  console.log(`Runner listening on ${await app.getUrl()}`);
}

bootstrap();
