import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Mission {
  idMission?: number;
  reference?: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  objetMission: string;
  statut?: string;
  dateSoumission?: string;
  motifAnnulation?: string;
  motifAvisSg?: string;
  idDirection: number;
  nomDirection?: string;
  chefMission?: ChefMissionView | null;
  participants?: ParticipantView[];
  affectations?: AffectationView[];
}

export interface ParticipantView {
  idAgent: number;
  nom: string;
  prenom: string;
  matricule: string;
  roleMission: string;
}

export interface ChefMissionView {
  idAgent: number;
  nom: string;
  prenom: string;
  matricule: string;
}

export interface AffectationView {
  idAffectation: number;
  idMission?: number;
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

export interface Direction {
  idDirection: number;
  nomDirection: string;
}

@Injectable({
  providedIn: 'root',
})
export class MissionService {
  private readonly API_URL = `${environment.apiUrl}/missions`;

  constructor(private readonly http: HttpClient) {}

  getAllMissions(statut?: string, idDirection?: number): Observable<Mission[]> {
    let params = '';
    if (statut) params += `?statut=${statut}`;
    if (idDirection) params += `${params ? '&' : '?'}idDirection=${idDirection}`;
    return this.http.get<Mission[]>(`${this.API_URL}${params}`);
  }

  getMissionById(id: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.API_URL}/${id}`);
  }

  createMission(mission: Partial<Mission>): Observable<Mission> {
    return this.http.post<Mission>(`${this.API_URL}/soumettre`, mission);
  }

  updateMission(id: number, mission: Partial<Mission>): Observable<Mission> {
    return this.http.put<Mission>(`${this.API_URL}/${id}`, mission);
  }

  validateMission(id: number): Observable<Mission> {
    return this.http.patch<Mission>(`${this.API_URL}/${id}/valider`, {});
  }

  donnerAvisSG(id: number, favorable: boolean, motif?: string): Observable<Mission> {
    return this.http.post<Mission>(`${this.API_URL}/${id}/avis-sg`, { favorable, motif: motif ?? null });
  }

  cancelMission(id: number, motif: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.API_URL}/${id}/annuler`, { motif });
  }

  extendMission(id: number, nouvelleDateFin: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.API_URL}/${id}/prolonger`, { nouvelleDateFin });
  }

  closeMission(id: number): Observable<Mission> {
    return this.http.patch<Mission>(`${this.API_URL}/${id}/cloturer`, {});
  }

  getMissionsAVenir(): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.API_URL}/a-venir`);
  }

  getParticipants(id: number): Observable<ParticipantView[]> {
    return this.http.get<ParticipantView[]>(`${this.API_URL}/${id}/participants`);
  }

  // Téléchargement de la fiche de mission au format PDF (logo CARFO + mise en page)
  downloadFichePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/fiche`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
  }
}
