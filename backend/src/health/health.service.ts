import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthCheckResult {
  status: 'ok';
  timestamp: string;
  database: {
    status: 'up';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp,
        database: {
          status: 'up',
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        message: 'Service unavailable',
        database: {
          status: 'down',
        },
      });
    }
  }
}
