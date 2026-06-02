import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiUrl = `${environment.apiUrl}/api/payment`;

  constructor(private http: HttpClient) {}

  /**
   * Crée un PaymentIntent côté backend et retourne le clientSecret
   * @param amount - montant en millimes TND (ex: 400000 = 400.000 DT)
   * @param description - description de la réservation
   * Le backend gère la conversion TND → EUR pour Stripe
   */
  createPaymentIntent(amount: number, description: string): Observable<{ clientSecret: string; paymentIntentId: string }> {
    return this.http.post<{ clientSecret: string; paymentIntentId: string }>(
      `${this.apiUrl}/create-payment-intent`,
      {
        amount,
        description
      }
    );
  }

  /**
   * Récupère la clé publique Stripe depuis le backend
   */
  getPublicKey(): Observable<{ publicKey: string }> {
    return this.http.get<{ publicKey: string }>(`${this.apiUrl}/config`);
  }
}
