import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SessionSoumission {
  idSession?: number;
  titre: string;
  description?: string;
  dateOuverture: string; // YYYY-MM-DD
  dateFermeture: string; // YYYY-MM-DD
  dateCreation?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSoumissionService {
  private readonly API_URL = `${environment.apiUrl}/sessions`;

  constructor(private readonly http: HttpClient) {}

  listAll(): Observable<SessionSoumission[]> {
    return this.http.get<SessionSoumission[]>(this.API_URL);
  }

  /** Renvoie la session active du jour, ou null si aucune (le backend renvoie 204 NO_CONTENT). */
  getActive(): Observable<SessionSoumission | null> {
    return this.http
      .get<SessionSoumission>(`${this.API_URL}/active`, { observe: 'response' })
      .pipe(
        map((res) => (res.status === 204 ? null : (res.body ?? null))),
        catchError(() => of(null))
      );
  }

  create(session: SessionSoumission): Observable<SessionSoumission> {
    return this.http.post<SessionSoumission>(this.API_URL, session);
  }

  update(id: number, session: SessionSoumission): Observable<SessionSoumission> {
    return this.http.put<SessionSoumission>(`${this.API_URL}/${id}`, session);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
