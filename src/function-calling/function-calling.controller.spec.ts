import { Test, TestingModule } from '@nestjs/testing';
import { FunctionCallingController } from './function-calling.controller';

describe('FunctionCallingController', () => {
  let controller: FunctionCallingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FunctionCallingController],
    }).compile();

    controller = module.get<FunctionCallingController>(FunctionCallingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
