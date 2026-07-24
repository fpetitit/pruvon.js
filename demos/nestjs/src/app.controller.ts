import { Controller, Get, Query } from '@nestjs/common';
import { NameSplitterService } from './name-splitter.service';

@Controller()
export class AppController {
  constructor(private readonly nameSplitterService: NameSplitterService) {}

  @Get('split')
  split(@Query('name') name: string) {
    return this.nameSplitterService.split(name);
  }
}
