import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../model/categorie.model';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private apiUrl = `${environment.apiUrl}/api/categories`;

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  private getHeaders() {
    const token = this.keycloak.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // Récupérer toutes les catégories
  getAll(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Créer une nouvelle catégorie
  create(category: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(this.apiUrl, category, { headers: this.getHeaders() });
  }

  // Mettre à jour une catégorie existante
  update(id: number, category: Categorie): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.apiUrl}/${id}`, category, { headers: this.getHeaders() });
  }

  // Supprimer une catégorie
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}