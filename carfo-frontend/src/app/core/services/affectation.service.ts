import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AffectationRequest {
  idMission: number;
  idChauffeur: number;
  idVehicule: number;
}

export interface AffectationView {
  idAffectation: number;
  idMission: number;
  idChauffeur: number;
  nomChauffeur: string;
  prenomChauffeur: string;
  idVehicule: number;
  immatriculationVehicule: string;
  marqueVehicule: string;
  modeleVehicule: string;
  statut?: 'ACTIVE' | 'ANNULEE';
  dateAffectation?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AffectationService {
  private readonly API_URL = `${environment.apiUrl}/affectations`;

  constructor(private readonly http: HttpClient) {}

  // GET /api/affectations
  getAllAffectations(): Observable<AffectationView[]> {
    return this.http.get<AffectationView[]>(this.API_URL);
  }

  // POST /api/affectations
  createAffectation(request: AffectationRequest): Observable<AffectationView> {
    return this.http.post<AffectationView>(this.API_URL, request);
  }

  /** GET /api/affectations/mission/{id} — toutes les affectations (ACTIVE + ANNULEE) d'une mission. */
  getAffectationsByMission(missionId: number): Observable<AffectationView[]> {
    return this.http.get<AffectationView[]>(`${this.API_URL}/mission/${missionId}`);
  }

  // GET /api/affectations/chauffeur/{id}
  getAffectationsByChauffeur(chauffeurId: number): Observable<AffectationView[]> {
    return this.http.get<AffectationView[]>(`${this.API_URL}/chauffeur/${chauffeurId}`);
  }

  /** DELETE /api/affectations/{idAffectation} — soft-delete (statut ANNULEE). */
  deleteAffectation(idAffectation: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${idAffectation}`);
  }
}
