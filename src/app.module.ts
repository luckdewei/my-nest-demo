import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ModelsModule } from './models/models.module';
import { PromptsModule } from './prompts/prompts.module';
import { ChainsModule } from './chains/chains.module';
import { AgentsModule } from './agents/agents.module';
import { MemoryModule } from './memory/memory.module';
import { RagModule } from './rag/rag.module';
import { FunctionCallingModule } from './function-calling/function-calling.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PostModule,
    ModelsModule,
    PromptsModule,
    ChainsModule,
    AgentsModule,
    MemoryModule,
    RagModule,
    FunctionCallingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
