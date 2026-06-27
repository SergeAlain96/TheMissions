import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="variant === 'list'" class="space-y-3">
      <div *ngFor="let _ of placeholders" class="carfo-card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="skeleton h-5 w-1/3"></div>
          <div class="skeleton h-5 w-20 rounded-full"></div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-full"></div>
        </div>
        <div class="flex gap-2">
          <div class="skeleton h-9 w-24"></div>
          <div class="skeleton h-9 w-24"></div>
        </div>
      </div>
    </div>

    <div *ngIf="variant === 'kpi'" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div *ngFor="let _ of placeholders.slice(0, 4)" class="carfo-card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="skeleton h-10 w-10 rounded-lg"></div>
          <div class="skeleton h-5 w-12 rounded-full"></div>
        </div>
        <div class="skeleton h-8 w-1/2 mb-2"></div>
        <div class="skeleton h-4 w-3/4"></div>
      </div>
    </div>
  `,
})
export class LoadingSkeletonComponent {
  @Input() variant: 'list' | 'kpi' = 'list';
  @Input() count = 3;
  get placeholders(): number[] {
    return Array.from({ length: this.count });
  }
}
