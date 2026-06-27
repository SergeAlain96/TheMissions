import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  idConfig?: number;
  // Identité institutionnelle
  institutionNom: string;
  institutionSigle: string;
  institutionPays: string;
  institutionDevise: string;
  institutionAdresse: string;
  institutionEmail?: string;
  institutionTelephone?: string;
  // Règles métier configurables
  delaiMinJoursOuvrables?: number;
  referencePrefix?: string;
  referenceNumberPadding?: number;
  autoClosureEnabled?: boolean;
  excludeWeekends?: boolean;
  sessionStrictMode?: boolean;
  // Comptes & sécurité
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireDigit?: boolean;
  passwordRequireSpecial?: boolean;
  jwtExpirationHours?: number;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly API_URL = `${environment.apiUrl}/config`;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<AppConfig> {
    return this.http.get<AppConfig>(this.API_URL);
  }

  update(payload: AppConfig): Observable<AppConfig> {
    return this.http.put<AppConfig>(this.API_URL, payload);
  }
}
