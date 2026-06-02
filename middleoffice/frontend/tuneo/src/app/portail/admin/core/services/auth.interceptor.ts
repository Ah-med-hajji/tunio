import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../../../environments/environment';

const API_PREFIXES = [
  environment.apiUrl + '/',
  'http://localhost:8081/',
  'http://127.0.0.1:8081/',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const targetsApi = API_PREFIXES.some((p) => req.url.startsWith(p));
  if (!targetsApi) return next(req);

  const keycloak = inject(KeycloakService);
  if (!keycloak.isAuthenticated()) {
    return next(req);
  }

  return from(keycloak.updateToken(30).catch(() => false)).pipe(
    switchMap(() => {
      const token = keycloak.getToken();
      if (!token) return next(req);
      const authed = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authed);
    })
  );
};
