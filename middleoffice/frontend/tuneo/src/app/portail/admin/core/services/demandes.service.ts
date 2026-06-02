import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap, map } from 'rxjs';
import { Demande } from '../model/demande.model';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DemandesService {

  private apiUrl = `${environment.apiUrl}/api/demandes`;

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  private getHeaders(): Observable<{ headers: { Authorization: string } }> {
    return from(this.keycloak.getToken()).pipe(
      map(token => ({ headers: { Authorization: `Bearer ${token}` } }))
    );
  }

  getAll(): Observable<Demande[]> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.get<Demande[]>(this.apiUrl, opts))
    );
  }

  getPending(): Observable<Demande[]> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.get<Demande[]>(`${this.apiUrl}/pending`, opts))
    );
  }

  create(demande: Demande): Observable<Demande> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.post<Demande>(this.apiUrl, demande, opts))
    );
  }

  accept(id: number): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.put(`${this.apiUrl}/${id}/accept`, {}, opts))
    );
  }

  refuse(id: number): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.put(`${this.apiUrl}/${id}/refuse`, {}, opts))
    );
  }

  delete(id: number): Observable<void> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.delete<void>(`${this.apiUrl}/${id}`, opts))
    );
  }
}