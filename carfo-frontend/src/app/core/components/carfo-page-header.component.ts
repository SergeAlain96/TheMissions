import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carfo-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-12">
      <h1 class="text-4xl font-bold text-white mb-2">{{ title }}</h1>
      <p class="text-lg text-gray-200">{{ description }}</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CarfoPageHeaderComponent {
  @Input() title: string = '';
  @Input() description: string = '';
}
