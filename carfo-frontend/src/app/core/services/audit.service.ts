import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AuditCategory = 'AUTH' | 'MISSION' | 'AFFECTATION' | 'AGENT' | 'CONFIG' | 'OTHER';

export interface AuditLog {
  idAudit: number;
  timestamp: string;
  agentEmail?: string | null;
  agentNom?: string | null;
  category: AuditCategory;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  summary?: string | null;
  ipAddress?: string | null;
}

export interface AuditPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AuditFilters {
  category?: AuditCategory;
  email?: string;
  fromDate?: string; // ISO LocalDateTime
  toDate?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly API_URL = `${environment.apiUrl}/audit`;

  constructor(private readonly http: HttpClient) {}

  search(filters: AuditFilters = {}): Observable<AuditPage> {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.email?.trim()) params = params.set('email', filters.email.trim());
    if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters.toDate) params = params.set('toDate', filters.toDate);
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 30));
    return this.http.get<AuditPage>(this.API_URL, { params });
  }
}
