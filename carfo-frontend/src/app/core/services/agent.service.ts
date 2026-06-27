import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Agent {
  idAgent?: number;
  nom: string;
  prenom: string;
  matricule: string;
  username?: string;
  email?: string | null;       // null tant que l'agent n'a pas de compte
  telephone?: string;
  fonction?: string;
  role?: string | null;        // null tant que l'agent n'a pas de compte
  idDirection?: number;
  nomDirection?: string;
  estChauffeur?: boolean;
  actif?: boolean;
  hasAccount?: boolean;        // calculé côté backend
}

/** Création d'un agent (identité seule, sans compte d'accès). */
export interface CreateAgentRequest {
  nom: string;
  prenom: string;
  matricule: string;
  fonction?: string;
  telephone?: string;
  estChauffeur?: boolean;
  idDirection: number;
}

/** Création d'un compte d'accès pour un agent existant. */
export interface CreateAccountRequest {
  idAgent: number;
  email: string;
  motDePasse: string;
  role: string;
}

/** Vue admin d'un compte agent (onglet Paramètres → Comptes & sécurité). */
export interface AgentAccountView {
  idAgent: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  nomDirection?: string | null;
  actif: boolean;
  lastLoginAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly API_URL = `${environment.apiUrl}/agents`;

  constructor(private http: HttpClient) {}

  getAllAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.API_URL);
  }

  getAgentById(id: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.API_URL}/${id}`);
  }

  updateAgent(id: number, agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.API_URL}/${id}`, agent);
  }

  deactivateAgent(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/desactiver`, {});
  }

  reactivateAgent(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/reactiver`, {});
  }

  /** Vue admin des comptes : matricule, nom, rôle, direction, actif, dernière connexion. */
  getComptes(): Observable<AgentAccountView[]> {
    return this.http.get<AgentAccountView[]>(`${this.API_URL}/comptes`);
  }

  getAllChauffeurs(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.API_URL}/chauffeurs`);
  }

  // Chauffeurs disponibles sur une période (pas d'absence, pas déjà affectés)
  getAvailableAgents(dateDebut: string, dateFin: string): Observable<Agent[]> {
    return this.http.get<Agent[]>(
      `${this.API_URL}/disponibles?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
  }

  getAgentsByDirection(idDirection: number): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.API_URL}/direction/${idDirection}`);
  }

  /** Crée un agent sans compte (identité seule). */
  createAgentIdentity(payload: CreateAgentRequest): Observable<Agent> {
    return this.http.post<Agent>(`${this.API_URL}/identity`, payload);
  }

  /** Liste des agents sans compte d'accès (pour le sélecteur de création de compte). */
  getAgentsSansCompte(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.API_URL}/sans-compte`);
  }

  /** Crée un compte d'accès pour un agent existant. */
  createAccount(payload: CreateAccountRequest): Observable<Agent> {
    return this.http.post<Agent>(`${this.API_URL}/account`, payload);
  }

  /** Modifie le rôle et/ou l'email d'un compte existant. */
  updateAccount(idAgent: number, email: string, role: string): Observable<Agent> {
    return this.http.patch<Agent>(`${this.API_URL}/${idAgent}/account`, { email, role });
  }
}
