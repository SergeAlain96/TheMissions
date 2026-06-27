import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Province {
  idProvince: number;
  nom: string;
  chefLieu: string;
}

@Injectable({ providedIn: 'root' })
export class ProvinceService {
  private readonly API_URL = `${environment.apiUrl}/provinces`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Province[]> {
    return this.http.get<Province[]>(this.API_URL);
  }
}
