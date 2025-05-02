import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger-setup';
import fastifyCookie from '@fastify/cookie';
import { ApiGatewayModule } from './api-gateway.module';
import { AllExceptionsFilter } from './common/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApiGatewayModule,
    new FastifyAdapter({}),
    {
      logger: ['error', 'warn', 'debug', 'verbose'],
    }
  );

  const configService = app.get(ConfigService);

  app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });

  configService.get('NODE_ENV') === 'production' && app.register(fastifyHelmet);
  app.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
  app.register(multipart);

  app.register(fastifyCors, {
    credentials: true,
    origin: (origin, callback) => {
      if (configService.get<string>('NODE_ENV') === 'development' || origin === configService.get<string>('CLIENT_URL')) {
        return callback(null, true);
      }
      return callback(new BadRequestException('Wrong Step'), false);
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  // global exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    stopAtFirstError: true,
  }));
  app.setGlobalPrefix('api');

  // swagger docs setup
  configService.get('NODE_ENV') !== 'production' && setupSwagger(app);

  await app.listen(configService.getOrThrow<number>('PORT'), '0.0.0.0', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log(`Server listening on ${address}`);
    }
  });
}
bootstrap();
