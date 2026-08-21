import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// Several tables use BigInt primary keys (punch_id, attendance_id, entry_id, payroll_id —
// all BIGSERIAL per the LLD DDL). Prisma returns these as native `bigint`, which
// JSON.stringify cannot serialize by default and throws on for any endpoint that returns
// a row containing one. Rather than manually `.toString()` every BigInt field across every
// service, serialize them as strings globally — the standard fix for this well-known
// Node/JSON limitation.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("PunchCloud API")
    .setDescription("Attendance, production & payroll API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/docs", app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`PunchCloud API listening on port ${port}`);
}

bootstrap();
