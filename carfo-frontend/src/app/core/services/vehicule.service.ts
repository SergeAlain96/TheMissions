import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vehicule {
  idVehicule?: number;
  immatriculation: string;
  marque: string;
  modele: string;
  typeVehicule?: string;
  capacite?: number;
  dateAcquisition?: string;
  statut?: string; // DISPONIBLE | EN_MISSION | EN_MAINTENANCE
  actif?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VehiculeService {
  private readonly API_URL = `${environment.apiUrl}/vehicules`;

  constructor(private http: HttpClient) {}

  getAllVehicles(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(this.API_URL);
  }

  getVehicleById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.API_URL}/${id}`);
  }

  createVehicle(vehicle: Vehicule): Observable<Vehicule> {
    return this.http.post<Vehicule>(this.API_URL, vehicle);
  }

  updateVehicle(id: number, vehicle: Vehicule): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.API_URL}/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // Véhicules disponibles sur une période (filtre côté backend)
  getAvailableVehicles(dateDebut: string, dateFin: string): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(
      `${this.API_URL}/disponibles?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
  }
}
