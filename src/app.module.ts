import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { LanggraphController } from './langgraph/langgraph.controller';
import { LanggraphService } from './langgraph/langgraph.service';
import { LanggraphModule } from './langgraph/langgraph.module';

@Module({
  imports: [PrismaModule, UserModule, PostModule, LanggraphModule],
  controllers: [AppController, LanggraphController],
  providers: [AppService, LanggraphService],
})
export class AppModule {}
