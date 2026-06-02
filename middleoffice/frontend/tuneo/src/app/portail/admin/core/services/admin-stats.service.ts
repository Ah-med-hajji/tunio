import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface MonthPoint {
  month: string;
  value: number;
}

export interface RecentReservation {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  keycloakUserId: string;
  placeId: number | null;
  placeName: string | null;
  placeImageUrl: string | null;
  stripePaymentId: string | null;
}

export interface AdminStats {
  usersCount: number;
  placesCount: number;
  categoriesCount: number;
  reservationsCount: number;
  transactionsCount: number;
  activePartners: number;
  pendingDemandes: number;
  revenueTnd: number;
  reservationStatusBreakdown: Record<'PENDING' | 'CONFIRMED' | 'CANCELLED', number>;
  monthlyReservations: MonthPoint[];
  monthlyRevenue: MonthPoint[];
  recentReservations: RecentReservation[];
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }
}
