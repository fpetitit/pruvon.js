import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { NameSplitterService } from './name-splitter.service';

@Module({
  controllers: [AppController],
  providers: [NameSplitterService],
})
export class AppModule {}
