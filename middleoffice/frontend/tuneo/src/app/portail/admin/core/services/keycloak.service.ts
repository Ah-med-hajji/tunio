import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import Keycloak from 'keycloak-js';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloakAuth: Keycloak | any;
  private router = inject(Router);

  constructor() {}

  init(): Promise<boolean> {
    const keycloakConfig = {
      url: environment.keycloakUrl,
      realm: environment.keycloakRealm,
      clientId: environment.keycloakClientId,
    };

    this.keycloakAuth = new Keycloak(keycloakConfig);

    return new Promise((resolve, reject) => {
      this.keycloakAuth
        .init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri:
            window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
          pkceMethod: 'S256',
        })
        .then((authenticated: boolean) => {
          if (authenticated) {
            const decoded: any = jwtDecode(this.getToken());
            const roles: string[] =
              decoded?.resource_access?.tuneoproject?.roles || [];

            if (roles.length > 0) {
              localStorage.setItem('role', roles[0]);
            }
            if (decoded?.sub) {
              localStorage.setItem('userId', decoded.sub);
            }

            const currentPath = window.location.pathname;
            const onAuthLanding = currentPath === '/' || currentPath === '/signin';
            if (onAuthLanding) {
              if (roles.includes('role_admin') || roles.includes('role_partner')) {
                this.router.navigate(['/dashboard']);
              } else if (roles.includes('role_user')) {
                this.router.navigate(['/user/dashboard']);
              }
            }
          }

          resolve(authenticated);
        })
        .catch((error: any) => {
          console.error('Keycloak initialization failed', error);
          reject(error);
        });
    });
  }

  /**
   * Rafraîchit le token si expirant dans moins de minValidity secondes
   */
  updateToken(minValidity: number = 30): Promise<boolean> {
    return this.keycloakAuth.updateToken(minValidity);
  }

  /**
   * Retourne le token JWT actuel
   */
  getToken(): string {
    return this.keycloakAuth.token || '';
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.keycloakAuth.token;
  }

  /**
   * Retourne le nom d'utilisateur
   */
  getUsername(): string {
    return this.keycloakAuth.tokenParsed?.preferred_username || '';
  }

  /**
   * Returns the user's roles from the tuneoproject client. Falls back to realm roles.
   */
  getRoles(): string[] {
    const parsed = this.keycloakAuth?.tokenParsed;
    const clientRoles =
      parsed?.resource_access?.tuneoproject?.roles ?? [];
    if (clientRoles.length) return clientRoles;
    return parsed?.realm_access?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  login(loginHint?: string): Promise<void> {
    return this.keycloakAuth.login({
      redirectUri: window.location.origin + '/',
      loginHint: loginHint,
    });
  }

  /**
   * Triggers Keycloak's built-in password reset flow.
   * Realm must have "Forgot password" enabled and SMTP configured.
   */
  resetPassword(): Promise<void> {
    return this.keycloakAuth.login({
      action: 'UPDATE_PASSWORD',
      redirectUri: window.location.origin + '/',
    });
  }

  accountManagement(): Promise<void> {
    return this.keycloakAuth.accountManagement();
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    localStorage.clear();
    this.keycloakAuth.logout({ redirectUri: window.location.origin + '/user/homepage' });
  }

  /**
   * Retourne l'instance Keycloak
   */
  getInstance(): Keycloak {
    return this.keycloakAuth;
  }
}