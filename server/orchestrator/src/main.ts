import { NestFactory } from '@nestjs/core';
import { OrchestratorModule } from './orchestrator.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(OrchestratorModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const PORT = configService.get("PORT") || 3001;
  await app.listen(PORT);
  console.log(`Orchestrator listening on ${await app.getUrl()}`);
}
bootstrap();
