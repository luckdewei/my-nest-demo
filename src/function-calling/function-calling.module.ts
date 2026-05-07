import { Module } from '@nestjs/common';
import { FunctionCallingController } from './function-calling.controller';
import { FunctionCallingService } from './function-calling.service';

@Module({
  controllers: [FunctionCallingController],
  providers: [FunctionCallingService]
})
export class FunctionCallingModule {}
