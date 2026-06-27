import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

/**
 * Courbes d'easing inspirées de Framer Motion.
 * - `easeOut` : décélération naturelle, pour les entrées
 * - `easeIn`  : accélération, pour les sorties
 */
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * Page enter — fade + léger slide up.
 * À placer sur le conteneur principal d'une page (ou le wrapper du contenu dans AppShell).
 */
export const pageEnter = trigger('pageEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate(`360ms ${EASE_OUT}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/**
 * Dropdown / popover — scale + fade.
 * Utiliser sur l'élément qui apparaît / disparaît via *ngIf.
 */
export const dropdownEnter = trigger('dropdownEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95) translateY(-4px)' }),
    animate(`160ms ${EASE_OUT}`, style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`120ms ${EASE_IN_OUT}`, style({ opacity: 0, transform: 'scale(0.97) translateY(-2px)' })),
  ]),
]);

/**
 * List stagger — apparition en cascade des éléments d'une liste.
 * À placer sur le conteneur ; les enfants doivent être marqués `[@.disabled]="false"` ou
 * tout simplement présents avec `*ngFor`. Le trigger utilise `query` interne pour cibler `:enter`.
 */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        stagger(50, [
          animate(`300ms ${EASE_OUT}`, style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);
