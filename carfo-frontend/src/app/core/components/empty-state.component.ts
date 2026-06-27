import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="carfo-card p-12 text-center">
      <div class="h-14 w-14 mx-auto rounded-full bg-ink-100 text-ink-400 flex items-center justify-center mb-4">
        <app-icon [name]="icon" [size]="28"></app-icon>
      </div>
      <h3 class="text-lg font-bold text-ink-900 mb-1">{{ title }}</h3>
      <p class="text-sm text-ink-500 max-w-sm mx-auto mb-6">{{ description }}</p>
      <a *ngIf="ctaRoute && ctaLabel" [routerLink]="[ctaRoute]" class="btn btn-primary">
        {{ ctaLabel }}
      </a>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'inbox';
  @Input() title = 'Aucun élément';
  @Input() description = '';
  @Input() ctaLabel?: string;
  @Input() ctaRoute?: string;
}
