import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DirectionCount {
  direction: string;
  count: number;
}

export interface ChauffeurActivity {
  idAgent: number;
  nom: string;
  prenom: string;
  matricule: string;
  missions: number;
}

export interface ChauffeurStats {
  topChauffeur: ChauffeurActivity | null;
  leastChauffeur: ChauffeurActivity | null;
  missionsPerChauffeur: ChauffeurActivity[];
}

export interface VehiculeActivity {
  idVehicule: number;
  immatriculation: string;
  marque: string;
  modele: string;
  missions: number;
}

export interface VehiculeStats {
  topVehicule: VehiculeActivity | null;
  leastVehicule: VehiculeActivity | null;
  missionsPerVehicule: VehiculeActivity[];
}

export interface LieuCount {
  lieu: string;
  count: number;
}

export interface RessourcesSnapshot {
  totalAgents: number;
  totalChauffeurs: number;
  vehiculesDisponibles: number;
}

export interface PreviousYearKpi {
  total: number;
  validated: number;
  cancelled: number;
  pending: number;
}

export interface PreviousYearStats {
  year: number;
  kpi: PreviousYearKpi;
}

export interface StatisticsPayload {
  year: number;
  from?: string;
  to?: string;
  totalMissions: number;
  missionsValidated: number;
  missionsCancelled: number;
  missionsClosed: number;
  missionsPending: number;
  missionsByStatus: Record<string, number>;
  missionsByDirection: DirectionCount[];
  missionsByMonth: number[]; // length 12 : index 0 = janvier
  chauffeurStats: ChauffeurStats;
  vehiculeStats?: VehiculeStats;
  topLieux?: LieuCount[];
  ressources?: RessourcesSnapshot;
  previousYear?: PreviousYearStats;
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getStatistics(year?: number, from?: string, to?: string): Observable<StatisticsPayload> {
    let params = new HttpParams();
    if (from || to) {
      if (from) params = params.set('from', from);
      if (to) params = params.set('to', to);
    } else if (year !== undefined && year !== null) {
      params = params.set('year', String(year));
    }
    return this.http.get<StatisticsPayload>(`${this.API_URL}/statistics`, { params });
  }

  /** Téléchargement du rapport PDF annuel (blob). */
  downloadPdf(year: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/statistics/pdf`, {
      params: new HttpParams().set('year', String(year)),
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
  }

  /** Téléchargement des données en CSV (séparateur ; + BOM UTF-8 pour Excel). */
  downloadCsv(year: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/statistics/csv`, {
      params: new HttpParams().set('year', String(year)),
      responseType: 'blob',
      headers: { Accept: 'text/csv' },
    });
  }
}
