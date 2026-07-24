import { Injectable } from '@nestjs/common';

export interface SplitNameResult {
  firstName: string;
  lastName: string;
}

@Injectable()
export class NameSplitterService {
  split(fullName: string): SplitNameResult {
    const parts = fullName.trim().split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }
}
