import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type StatutChauffeur = 'DISPONIBLE' | 'INDISPONIBLE' | 'EN_MISSION' | 'ABSENT';

export interface ChauffeurStatus {
  idAgent: number;
  nom: string;
  prenom: string;
  matricule: string;
  telephone?: string;
  statutManuel: StatutChauffeur;
  statutEffectif: StatutChauffeur;
  dateDisponibilite?: string | null;
  missionEnCoursRef?: string | null;
  absenceFin?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChauffeurStatusService {
  private readonly API_URL = `${environment.apiUrl}/agents/chauffeurs`;

  constructor(private readonly http: HttpClient) {}

  listStatuses(): Observable<ChauffeurStatus[]> {
    return this.http.get<ChauffeurStatus[]>(`${this.API_URL}/statuts`);
  }

  updateStatut(idAgent: number, statut: 'DISPONIBLE' | 'INDISPONIBLE', dateDisponibilite?: string | null): Observable<ChauffeurStatus> {
    return this.http.patch<ChauffeurStatus>(`${this.API_URL}/${idAgent}/statut`, {
      statut,
      dateDisponibilite: dateDisponibilite ?? null,
    });
  }
}
