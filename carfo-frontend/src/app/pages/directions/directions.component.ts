import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarfoPageHeaderComponent } from '../../core/components/carfo-page-header.component';

@Component({
  selector: 'app-directions',
  standalone: true,
  imports: [CommonModule, RouterLink, CarfoPageHeaderComponent],
  template: `
    <div class="carfo-page-shell py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8 flex items-center justify-between">
          <app-carfo-page-header
            title="🏢 Directions"
            description="Gestion des directions et départements"
          ></app-carfo-page-header>
          <a
            [routerLink]="['/dashboard']"
            class="bg-white hover:bg-gray-100 text-carfo-primary font-bold py-2 px-4 rounded-lg transition h-fit"
          >
            ⬅️ Retour Dashboard
          </a>
        </div>

        <div class="bg-white/95 rounded-xl shadow-lg p-8">
          <p class="text-gray-700 text-lg">La gestion détaillée des directions est disponible dans ce module.</p>
          <p class="text-gray-500 mt-2">Le design est maintenant aligné sur la landing page CARFO.</p>
        </div>
      </div>
    </div>
  `,
})
export class DirectionsComponent {}
