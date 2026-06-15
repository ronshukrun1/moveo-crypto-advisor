import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  configureApplication(app, configService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Moveo Crypto Advisor API')
    .setDescription(
      'Backend API for the Moveo Crypto Advisor personalized cryptocurrency dashboard.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap().catch((error: unknown) => {
  console.error(
    'Failed to start application:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exit(1);
});
