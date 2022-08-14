import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { connectToMongo } from "./shared/db";

async function bootstrap() {
  await connectToMongo();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
