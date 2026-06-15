import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    healthService = module.get(HealthService);
  });

  it('returns ok when the database is reachable', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const result = await healthService.check();

    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('up');
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('throws ServiceUnavailableException when the database is unavailable', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(healthService.check()).rejects.toMatchObject({
      response: {
        message: 'Service unavailable',
        database: { status: 'down' },
      },
    });
  });
});
