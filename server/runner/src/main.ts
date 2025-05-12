import { NestFactory } from '@nestjs/core';
import { RunnerModule } from './runner.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(RunnerModule);

  const configService = app.get(ConfigService);

  const PORT = configService.get("PORT") || 3003;
  await app.listen(PORT);
  console.log(`Runner listening on ${await app.getUrl()}`);
}
bootstrap();
