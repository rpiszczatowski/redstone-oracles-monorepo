import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { runMonitoringService } from "./run-monitoring-service";

async function bootstrap() {
  runMonitoringService();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ["content-type"],
    origin: "http://localhost:3000",
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
