import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './portail/admin/pages/dashboard/admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './portail/admin/pages/profile/profile.component';
import { NotFoundComponent } from './portail/admin/pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './portail/admin/shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './portail/admin/pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './portail/admin/pages/auth-pages/sign-up/sign-up.component';
import { CategoriesComponent } from './portail/admin/pages/categories/categories.component';
import { DemandesComponent } from './portail/admin/pages/demandes/demandes.component';
import { DemandeFormComponent } from './portail/admin/pages/demande-form/demande-form.component';
import { KeycloakGuard } from './portail/admin/core/services/guards/keycloak.guard';
import { PlacesComponent } from './portail/admin/pages/places/places.component';
import { HomepageComponent } from './portail/user/pages/homepage/homepage.component';
import { PlacesPublicComponent } from './portail/user/pages/places-public/places-public.component';
import { HistoriqueComponent } from './portail/user/pages/historique/historique.component';
import { ReservationComponent } from './portail/user/pages/reservation/reservation.component';
import { UserDashboardComponent } from './portail/user/pages/dashboard/user-dashboard.component';
import { MesReservationsComponent } from './portail/user/pages/mes-reservations/mes-reservations.component';
import { ServicesComponent } from './portail/user/pages/services/services.component';
import { PackagesComponent } from './portail/user/pages/packages/packages.component';
import { CategoriesPublicComponent } from './portail/user/pages/categories-public/categories-public.component';
import { ContactComponent } from './portail/user/pages/contact/contact.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      // ── Default redirect ───────────────────────────────────────────────
      { path: '', redirectTo: 'user/homepage', pathMatch: 'full' },

      // ── Public ─────────────────────────────────────────────────────────
      { path: 'user/homepage',    component: HomepageComponent,         title: 'TUNÉO | Accueil' },
      { path: 'results',          component: PlacesPublicComponent,     title: 'TUNÉO | Résultats' },
      { path: 'services',         component: ServicesComponent,         title: 'TUNÉO | Services' },
      { path: 'packages',         component: PackagesComponent,         title: 'TUNÉO | Packages' },
      { path: 'categories-public',component: CategoriesPublicComponent, title: 'TUNÉO | Catégories' },
      { path: 'contact',          component: ContactComponent,          title: 'TUNÉO | Contact' },
      { path: 'reservation/:id',      component: ReservationComponent,  title: 'TUNÉO | Réservation' },
      { path: 'user/reservation/:id', component: ReservationComponent,  title: 'TUNÉO | Réservation' },

      // ── Authenticated ──────────────────────────────────────────────────
      { canActivate: [KeycloakGuard], path: 'profile',           component: ProfileComponent,        title: 'TUNÉO | Mon profil' },

      // ── Client (role_user) ────────────────────────────────────────────
      { canActivate: [KeycloakGuard], path: 'user/dashboard',    component: UserDashboardComponent,  title: 'TUNÉO | Mon tableau de bord' },
      { canActivate: [KeycloakGuard], path: 'user/reservations', component: MesReservationsComponent,title: 'TUNÉO | Mes réservations' },
      { canActivate: [KeycloakGuard], path: 'historique',        component: HistoriqueComponent,     title: 'TUNÉO | Historique' },

      // ── Admin / Partner ───────────────────────────────────────────────
      { canActivate: [KeycloakGuard], path: 'dashboard',         component: AdminDashboardComponent, title: 'TUNÉO | Tableau de bord' },
      { canActivate: [KeycloakGuard], path: 'categories',        component: CategoriesComponent,     title: 'TUNÉO | Catégories (admin)' },
      { canActivate: [KeycloakGuard], path: 'places',            component: PlacesComponent,         title: 'TUNÉO | Places (admin)' },
      { canActivate: [KeycloakGuard], path: 'demandes',          component: DemandesComponent,       title: 'TUNÉO | Demandes' },
      { canActivate: [KeycloakGuard], path: 'demande-form',      component: DemandeFormComponent,    title: 'TUNÉO | Soumettre une demande' },
    ],
  },

  // ── Auth pages ────────────────────────────────────────────────────────
  { path: 'signin', component: SignInComponent, title: 'TUNÉO | Connexion' },
  { path: 'signup', component: SignUpComponent, title: 'TUNÉO | Inscription' },

  // ── 404 ───────────────────────────────────────────────────────────────
  { path: '**', component: NotFoundComponent, title: 'TUNÉO | Page introuvable' },
];
