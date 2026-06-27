import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

const MISSION_STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PREVUE:              { label: 'Prévue',          bg: 'bg-amber-50',  text: 'text-amber-700',     dot: 'bg-amber-500' },
  AVIS_SG_FAVORABLE:   { label: 'Avis SG favorable',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  AVIS_SG_DEFAVORABLE: { label: 'Avis SG défavorable', bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
  INITIEE:             { label: 'Initiée',         bg: 'bg-blue-50',   text: 'text-blue-700',      dot: 'bg-blue-500' },
  EN_COURS:            { label: 'En cours',        bg: 'bg-carfo-50',  text: 'text-carfo-primary', dot: 'bg-carfo-primary' },
  CLOTUREE:            { label: 'Clôturée',        bg: 'bg-ink-100',   text: 'text-ink-700',       dot: 'bg-ink-500' },
  ANNULEE:             { label: 'Annulée',         bg: 'bg-red-50',    text: 'text-red-700',       dot: 'bg-red-500' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      [ngClass]="[meta.bg, meta.text]"
    >
      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="meta.dot"></span>
      {{ meta.label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined = '';

  get meta() {
    if (!this.status) {
      return { label: '—', bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' };
    }
    return MISSION_STATUS_META[this.status] ?? {
      label: this.status,
      bg: 'bg-ink-100',
      text: 'text-ink-700',
      dot: 'bg-ink-500',
    };
  }
}
