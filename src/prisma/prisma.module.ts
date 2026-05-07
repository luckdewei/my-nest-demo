import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() 设置为全局模块
// 只要在 AppModule 里注册一次，全项目都能注入 PrismaService
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
