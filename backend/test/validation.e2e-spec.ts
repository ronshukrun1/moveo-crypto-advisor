import {
  Body,
  Controller,
  Get,
  INestApplication,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';

class ValidationQueryDto {
  @Type(() => Number)
  @IsInt()
  page: number;
}

class ValidationBodyDto {
  @IsString()
  name: string;
}

@Controller('validation-test')
class ValidationTestController {
  @Get('query')
  getQuery(@Query() query: ValidationQueryDto) {
    return query;
  }

  @Post('body')
  postBody(@Body() body: ValidationBodyDto) {
    return body;
  }
}

describe('Validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unknown body fields with 400', () => {
    return request(app.getHttpServer())
      .post('/api/validation-test/body')
      .send({ name: 'BTC', unexpectedField: 'value' })
      .expect(400)
      .expect((response) => {
        const body = response.body as {
          statusCode: number;
          message: string;
          details: string[];
        };
        expect(body.statusCode).toBe(400);
        expect(body.message).toBe('Validation failed');
        expect(body.details).toEqual(
          expect.arrayContaining([expect.stringContaining('unexpectedField')]),
        );
      });
  });

  it('rejects invalid query transformation with 400', () => {
    return request(app.getHttpServer())
      .get('/api/validation-test/query?page=not-a-number')
      .expect(400)
      .expect((response) => {
        const body = response.body as {
          statusCode: number;
          message: string;
          details: string[];
        };
        expect(body.statusCode).toBe(400);
        expect(body.message).toBe('Validation failed');
        expect(body.details).toEqual(
          expect.arrayContaining([expect.stringMatching(/page/i)]),
        );
      });
  });

  it('accepts valid transformed query values', () => {
    return request(app.getHttpServer())
      .get('/api/validation-test/query?page=2')
      .expect(200)
      .expect({ page: 2 });
  });
});
