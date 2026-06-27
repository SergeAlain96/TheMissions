import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Direction {
  idDirection?: number;
  nomDirection: string;
  sigleDirection?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  private readonly API_URL = `${environment.apiUrl}/directions`;

  constructor(private http: HttpClient) {}

  getAllDirections(): Observable<Direction[]> {
    return this.http.get<Direction[]>(this.API_URL);
  }

  getDirectionById(id: number): Observable<Direction> {
    return this.http.get<Direction>(`${this.API_URL}/${id}`);
  }

  createDirection(payload: Direction): Observable<Direction> {
    return this.http.post<Direction>(this.API_URL, payload);
  }

  updateDirection(id: number, payload: Direction): Observable<Direction> {
    return this.http.put<Direction>(`${this.API_URL}/${id}`, payload);
  }

  deleteDirection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
