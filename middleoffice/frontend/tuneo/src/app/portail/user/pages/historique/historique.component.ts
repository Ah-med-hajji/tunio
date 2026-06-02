import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  Reservation,
  ReservationService,
  ReservationStatus,
} from '../../core/services/reservation.service';

type StatusFilter = 'ALL' | ReservationStatus;

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './historique.component.html',
  styleUrl: './historique.component.css',
})
export class HistoriqueComponent implements OnInit {
  private reservationService = inject(ReservationService);

  loading = true;
  error: string | null = null;
  reservations: Reservation[] = [];

  statusFilter: StatusFilter = 'ALL';
  fromDate = '';
  toDate = '';
  query = '';

  ngOnInit(): void {
    this.reservationService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('historique load failed', err);
        this.error =
          err?.status === 401
            ? 'Vous devez être connecté pour consulter votre historique.'
            : 'Impossible de charger vos réservations.';
        this.loading = false;
      },
    });
  }

  get filtered(): Reservation[] {
    const from = this.fromDate ? new Date(this.fromDate).getTime() : null;
    const to = this.toDate ? new Date(this.toDate).getTime() + 86_400_000 : null;
    const q = this.query.trim().toLowerCase();

    return this.reservations.filter((r) => {
      if (this.statusFilter !== 'ALL' && r.status !== this.statusFilter) return false;
      if (from && new Date(r.startDate).getTime() < from) return false;
      if (to && new Date(r.startDate).getTime() > to) return false;
      if (q) {
        const hay = `${r.place?.name || ''} ${r.place?.region || ''} ${r.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  resetFilters(): void {
    this.statusFilter = 'ALL';
    this.fromDate = '';
    this.toDate = '';
    this.query = '';
  }

  download(r: Reservation): void {
    this.reservationService.downloadInvoice(r.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservation-${r.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('download failed', err);
        alert('Téléchargement du reçu impossible.');
      },
    });
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
