import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: number;
  keycloakUserId: string;
  place?: {
    id: number;
    name: string;
    imageUrl?: string;
    address?: string;
    region?: string;
    categorie?: { id: number; name: string };
  };
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  specialRequests?: string;
  status: ReservationStatus;
  stripePaymentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReservationDashboard {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  upcoming: Reservation[];
}

export interface UpdateReservationPayload {
  startDate?: string;
  endDate?: string;
  numberOfPeople?: number;
  specialRequests?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {

  private apiUrl = `${environment.apiUrl}/api/reservations`;

  constructor(private http: HttpClient) {}

  /**
   * Create a reservation. The backend now derives the owner from the JWT,
   * but we keep keycloakUserId in the URL as a transitional fallback for
   * the existing reservation form.
   */
  createReservation(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/me`);
  }

  getMyDashboard(): Observable<ReservationDashboard> {
    return this.http.get<ReservationDashboard>(`${this.apiUrl}/me/dashboard`);
  }

  cancelReservation(id: number): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/cancel`, {});
  }

  updateReservation(id: number, payload: UpdateReservationPayload): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, payload);
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  getOccupiedDates(placeId: number): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/occupied-dates/${placeId}`);
  }

  downloadInvoice(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
