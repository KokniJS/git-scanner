import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { swaggerSetup } from './configs/swagger.config';

const port = process.env.PORT ?? 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  swaggerSetup(app);

  await app.listen(port);
  Logger.log(`Swagger route http://localhost:${port}/docs`);
}
bootstrap();
