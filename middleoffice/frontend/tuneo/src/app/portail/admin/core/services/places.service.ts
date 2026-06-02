import { Injectable } from '@angular/core';
import { Observable, from, switchMap, map } from 'rxjs';
import { Place } from '../model/place.model';
import { KeycloakService } from './keycloak.service';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private apiUrl = `${environment.apiUrl}/api/places`;

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  /**
   * Crée les headers avec le token Keycloak à jour
   */
  private getHeaders(): Observable<{ headers: HttpHeaders }> {
    return from(this.keycloak.updateToken(30)).pipe(
      switchMap(() => from([new HttpHeaders({
        Authorization: `Bearer ${this.keycloak.getToken()}`
      })])),
      map(headers => ({ headers }))
    );
  }

  /** Récupérer toutes les places */
  getAll(): Observable<Place[]> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.get<Place[]>(this.apiUrl, opts))
    );
  }

  /** Ajouter une nouvelle place */
  create(place: Place): Observable<Place> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.post<Place>(this.apiUrl, place, opts))
    );
  }

  /** Mettre à jour une place */
  update(id: number, place: Place): Observable<Place> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.put<Place>(`${this.apiUrl}/${id}`, place, opts))
    );
  }

  /** Supprimer une place */
  delete(id: number): Observable<void> {
    return this.getHeaders().pipe(
      switchMap(opts => this.http.delete<void>(`${this.apiUrl}/${id}`, opts))
    );
  }
getByFilters(params: {
  region?:     string;
  category?:   string;
  delegation?: string;
  checkIn?:    string;
  checkOut?:   string;
}): Observable<Place[]> {
  let httpParams = new HttpParams();
  if (params.region)     httpParams = httpParams.set('region',     params.region);
  if (params.category)   httpParams = httpParams.set('category',   params.category);
  if (params.delegation) httpParams = httpParams.set('delegation', params.delegation);
  if (params.checkIn)    httpParams = httpParams.set('checkIn',    params.checkIn);
  if (params.checkOut)   httpParams = httpParams.set('checkOut',   params.checkOut);

  return this.http.get<Place[]>(`${this.apiUrl}/search`, { params: httpParams });
}
getById(id: number): Observable<Place> {
  return this.getHeaders().pipe(
    switchMap(opts => this.http.get<Place>(`${this.apiUrl}/${id}`, opts))
  );
}
getAvailableCapacity(placeId: number, checkIn: string, checkOut: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/${placeId}/available-capacity`, {
    params: { checkIn, checkOut }
  });
}
}