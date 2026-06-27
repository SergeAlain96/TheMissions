import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <a
      *ngIf="route; else nonLinked"
      [routerLink]="[route]"
      class="block carfo-card p-5 hover:shadow-card-hover hover:border-ink-300 transition group"
    >
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </a>

    <ng-template #nonLinked>
      <div class="carfo-card p-5">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </div>
    </ng-template>

    <ng-template #content>
      <div class="flex items-start justify-between mb-3">
        <div
          class="h-10 w-10 rounded-lg flex items-center justify-center"
          [ngClass]="iconBgClass"
        >
          <app-icon [name]="icon" [size]="20"></app-icon>
        </div>
        <span
          *ngIf="badge !== undefined && badge !== null"
          class="text-xs font-semibold px-2 py-1 rounded-full"
          [ngClass]="badgeClass"
        >
          {{ badge }}
        </span>
      </div>
      <p class="text-3xl font-bold text-ink-900 tracking-tight">
        <span *ngIf="loading" class="skeleton inline-block h-8 w-16 align-middle"></span>
        <span *ngIf="!loading">{{ value }}</span>
      </p>
      <p class="text-sm font-medium text-ink-600 mt-1">{{ label }}</p>
      <p *ngIf="hint" class="text-xs text-ink-400 mt-1">{{ hint }}</p>
    </ng-template>
  `,
})
export class KpiCardComponent {
  @Input() icon: IconName = 'clipboard';
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() hint?: string;
  @Input() badge?: string | number | null;
  @Input() route?: string;
  @Input() loading = false;
  @Input() tone: 'green' | 'gold' | 'blue' | 'red' | 'gray' = 'green';

  get iconBgClass(): string {
    switch (this.tone) {
      case 'green': return 'bg-carfo-50 text-carfo-primary';
      case 'gold':  return 'bg-gold-50 text-gold-600';
      case 'blue':  return 'bg-blue-50 text-blue-700';
      case 'red':   return 'bg-red-50 text-red-700';
      default:      return 'bg-ink-100 text-ink-700';
    }
  }

  get badgeClass(): string {
    switch (this.tone) {
      case 'green': return 'bg-carfo-50 text-carfo-primary';
      case 'gold':  return 'bg-gold-50 text-gold-600';
      case 'blue':  return 'bg-blue-50 text-blue-700';
      case 'red':   return 'bg-red-50 text-red-700';
      default:      return 'bg-ink-100 text-ink-700';
    }
  }
}
