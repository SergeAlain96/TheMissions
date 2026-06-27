import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole =
  | 'AGENT'
  | 'DIRECTEUR_DIRECTION'
  | 'SECRETAIRE_GENERALE'
  | 'DIRECTEUR'
  | 'CHARGE_ETUDE'
  | 'ADMINISTRATEUR';

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  matricule: string;
  email: string;
  motDePasse: string;
  role: UserRole;
  idDirection: number;
  fonction?: string;
  telephone?: string;
  estChauffeur?: boolean;
}

export interface RegisterResponse {
  idAgent: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  nomDirection: string;
  username: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  idAgent: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  nomDirection?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'carfo_token';
  private readonly USER_KEY = 'carfo_user';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap((response) => this.setSession(response))
    );
  }

  /** Inscription d'un nouvel agent — appelée depuis Paramètres → Gestion des agents (admin). */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, request);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): LoginResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse) : null;
  }

  getRole(): UserRole | null {
    return this.getUser()?.role ?? null;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const role = this.getRole();
    return role ? roles.includes(role) : false;
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
  }
}
