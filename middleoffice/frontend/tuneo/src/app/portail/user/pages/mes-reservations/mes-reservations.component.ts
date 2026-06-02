import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  Reservation,
  ReservationService,
  UpdateReservationPayload,
} from '../../core/services/reservation.service';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './mes-reservations.component.html',
  styleUrls: ['./mes-reservations.component.css'],
})
export class MesReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);

  loading = true;
  error: string | null = null;
  busyId: number | null = null;
  reservations: Reservation[] = [];

  editing: Reservation | null = null;
  editForm: { startDate: string; endDate: string; numberOfPeople: number; specialRequests: string } = {
    startDate: '',
    endDate: '',
    numberOfPeople: 1,
    specialRequests: '',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.reservationService.getMyReservations().subscribe({
      next: (data) => {
        // Show non-cancelled first, then by start date asc.
        this.reservations = [...data].sort((a, b) => {
          if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
          if (b.status === 'CANCELLED' && a.status !== 'CANCELLED') return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('mes-reservations load failed', err);
        this.error =
          err?.status === 401
            ? 'Vous devez être connecté pour gérer vos réservations.'
            : 'Impossible de charger vos réservations.';
        this.loading = false;
      },
    });
  }

  canEdit(r: Reservation): boolean {
    return r.status === 'PENDING';
  }
  canCancel(r: Reservation): boolean {
    return r.status === 'PENDING';
  }

  cancel(r: Reservation): void {
    if (!this.canCancel(r) || this.busyId === r.id) return;
    if (!confirm(`Annuler la réservation #${r.id} pour « ${r.place?.name || ''} » ?`)) return;
    this.busyId = r.id;
    this.reservationService.cancelReservation(r.id).subscribe({
      next: (updated) => {
        Object.assign(r, updated);
        this.busyId = null;
      },
      error: (err) => {
        console.error('cancel failed', err);
        alert(err?.error?.message || "L'annulation a échoué.");
        this.busyId = null;
      },
    });
  }

  startEdit(r: Reservation): void {
    if (!this.canEdit(r)) return;
    this.editing = r;
    this.editForm = {
      startDate: this.toInputDate(r.startDate),
      endDate: this.toInputDate(r.endDate),
      numberOfPeople: r.numberOfPeople,
      specialRequests: r.specialRequests || '',
    };
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(form: NgForm): void {
    if (!this.editing || form.invalid || this.busyId === this.editing.id) return;
    const payload: UpdateReservationPayload = {
      startDate: this.toIsoSeconds(this.editForm.startDate),
      endDate: this.toIsoSeconds(this.editForm.endDate),
      numberOfPeople: Number(this.editForm.numberOfPeople),
      specialRequests: this.editForm.specialRequests,
    };
    this.busyId = this.editing.id;
    this.reservationService.updateReservation(this.editing.id, payload).subscribe({
      next: (updated) => {
        const idx = this.reservations.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.reservations[idx] = { ...this.reservations[idx], ...updated };
        this.busyId = null;
        this.editing = null;
      },
      error: (err) => {
        console.error('update failed', err);
        alert(err?.error?.message || 'La modification a échoué.');
        this.busyId = null;
      },
    });
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

  private toInputDate(isoLike: string): string {
    if (!isoLike) return '';
    return isoLike.slice(0, 16); // yyyy-MM-ddTHH:mm
  }

  private toIsoSeconds(local: string): string {
    if (!local) return '';
    return local.length === 16 ? local + ':00' : local;
  }
}
