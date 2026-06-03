import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'tr', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private sub: Subscription;

  constructor(private ts: TranslationService) {
    // Subscribe so Angular re-evaluates impure pipe when language changes
    this.sub = ts.lang$.subscribe();
  }

  transform(key: string): string {
    return this.ts.t(key);
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
