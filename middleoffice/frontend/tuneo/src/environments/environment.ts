/**
 * Development environment.
 * Override by replacing this file at build time with environment.prod.ts —
 * see `fileReplacements` in angular.json.
 */
export const environment = {
  production: false,
  /** Spring Boot base URL (no trailing slash). */
  apiUrl: 'http://localhost:8081',
  /** Keycloak server base URL (no trailing slash). */
  keycloakUrl: 'http://localhost:9090',
  /** Keycloak realm. */
  keycloakRealm: 'TUNEO',
  /** Keycloak client id used by the SPA. */
  keycloakClientId: 'tuneoproject',
};
