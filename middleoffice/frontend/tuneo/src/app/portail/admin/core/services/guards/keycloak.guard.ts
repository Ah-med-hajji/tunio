import { inject, Injectable } from '@angular/core';
import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '../keycloak.service';
import { jwtDecode } from 'jwt-decode';


export const KeycloakGuard: CanActivateFn = async () => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

const isAuthenticated = await keycloak.isAuthenticated();

  if (isAuthenticated) {
    return true;
  }

  // Not logged in → redirect to Keycloak login
  keycloak.login();
  return false;

};