import { NestFactory } from '@nestjs/core';
import { RunnerModule } from './runner.module';

async function bootstrap() {
  const app = await NestFactory.create(RunnerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
