import { Test, TestingModule } from '@nestjs/testing';
import { FunctionCallingService } from './function-calling.service';

describe('FunctionCallingService', () => {
  let service: FunctionCallingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FunctionCallingService],
    }).compile();

    service = module.get<FunctionCallingService>(FunctionCallingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
