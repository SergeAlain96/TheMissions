import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="carfo-page-shell py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-white">📅 Absences</h1>
            <p class="mt-2 text-gray-100">Suivi et validation des absences</p>
          </div>
          <a
            [routerLink]="['/dashboard']"
            class="bg-white hover:bg-gray-100 text-carfo-primary font-bold py-2 px-4 rounded-lg transition"
          >
            ⬅️ Retour Dashboard
          </a>
        </div>

        <div class="bg-white/95 rounded-xl shadow-lg p-8">
          <p class="text-gray-700 text-lg">Le module absences est prêt pour les prochains écrans métier.</p>
          <p class="text-gray-500 mt-2">Le style visuel est harmonisé avec la landing page CARFO.</p>
        </div>
      </div>
    </div>
  `,
})
export class AbsencesComponent {}
