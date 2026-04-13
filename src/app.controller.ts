import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      service: 'ekyc-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
