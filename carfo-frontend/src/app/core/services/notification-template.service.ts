import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type NotificationType =
  | 'MISSION_SOUMISE'
  | 'AVIS_SG_FAVORABLE'
  | 'AVIS_SG_DEFAVORABLE'
  | 'MISSION_VALIDEE'
  | 'MISSION_ANNULEE'
  | 'MISSION_CLOTUREE'
  | 'AFFECTATION_CREEE'
  | 'AFFECTATION_SUPPRIMEE'
  | 'ABSENCE_DECLAREE';

export interface NotificationTemplate {
  notificationType: NotificationType;
  titre: string;
  corps: string;
  actif: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationTemplateService {
  private readonly API_URL = `${environment.apiUrl}/notification-templates`;

  constructor(private readonly http: HttpClient) {}

  listAll(): Observable<NotificationTemplate[]> {
    return this.http.get<NotificationTemplate[]>(this.API_URL);
  }

  update(type: NotificationType, payload: NotificationTemplate): Observable<NotificationTemplate> {
    return this.http.put<NotificationTemplate>(`${this.API_URL}/${type}`, payload);
  }
}
