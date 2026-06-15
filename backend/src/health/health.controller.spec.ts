import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthService: { check: jest.Mock };

  beforeEach(async () => {
    healthService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    healthController = module.get(HealthController);
  });

  it('returns the health service result', async () => {
    const healthResult = {
      status: 'ok' as const,
      timestamp: '2026-06-15T12:00:00.000Z',
      database: { status: 'up' as const },
    };
    healthService.check.mockResolvedValue(healthResult);

    await expect(healthController.check()).resolves.toEqual(healthResult);
    expect(healthService.check).toHaveBeenCalled();
  });
});
