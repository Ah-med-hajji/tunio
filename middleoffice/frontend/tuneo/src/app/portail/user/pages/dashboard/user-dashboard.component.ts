import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { KeycloakService } from '../../../admin/core/services/keycloak.service';
import {
  ReservationDashboard,
  ReservationService,
} from '../../core/services/reservation.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private keycloak = inject(KeycloakService);
  private router = inject(Router);

  loading = true;
  error: string | null = null;
  dashboard: ReservationDashboard | null = null;

  ngOnInit(): void {
    this.reservationService.getMyDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('user dashboard failed', err);
        this.error =
          err?.status === 401
            ? 'Vous devez être connecté pour consulter votre tableau de bord.'
            : 'Impossible de charger vos réservations.';
        this.loading = false;
      },
    });
  }

  firstName(): string {
    const parsed = (this.keycloak as any).getInstance?.()?.tokenParsed;
    return parsed?.given_name || parsed?.preferred_username || 'Bienvenue';
  }

  goSearch(): void {
    this.router.navigate(['/user/homepage']);
  }
  goManage(): void {
    this.router.navigate(['/user/reservations']);
  }
  goHistory(): void {
    this.router.navigate(['/historique']);
  }
  goProfile(): void {
    this.router.navigate(['/profile']);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING':   return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'CANCELLED': return 'Annulée';
      default:          return status;
    }
  }
  statusClass(status: string): string {
    switch (status) {
      case 'PENDING':   return 'badge-amber';
      case 'CONFIRMED': return 'badge-emerald';
      case 'CANCELLED': return 'badge-rose';
      default:          return 'badge-gray';
    }
  }
}
