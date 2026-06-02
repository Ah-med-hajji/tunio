import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  private baseUrl = `${environment.apiUrl}/api/users`;
  private keycloakUrl = `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/token`;

  constructor(private http: HttpClient) {}

  register(payload: any) {
    return this.http.post(`${this.baseUrl}/register`, payload, {
      responseType: 'text',
    });
  }

  login(data: { username: string; password: string }) {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', environment.keycloakClientId);
    body.set('username', data.username);
    body.set('password', data.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.keycloakUrl, body.toString(), { headers });
  }
}