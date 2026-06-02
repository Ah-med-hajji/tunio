import { Component, Input, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../core/services/reservation.service';
import { PlacesService } from '../../../admin/core/services/places.service';
import { Place } from '../../../admin/core/model/place.model';
import { StripePaymentComponent } from '../stripe-payment/stripe-payment.component';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [FormsModule, CommonModule, StripePaymentComponent],
  templateUrl: './reservation.component.html'
})

export class ReservationComponent implements OnInit, OnChanges {

  placeId!: number;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  success: boolean = false;
  errorMessage: string = '';
  occupiedRanges: any;
  disabledDates: string[] = [];
  // Capacité
  totalCapacity: number = 0;
  availableCapacity: number = 0;
  capacityLoading: boolean = false;

  // ✅ STRIPE - paiement
  showPayment: boolean = false;
  paymentAmountCents: number = 0;   // montant en centimes pour Stripe
  pricePerNight: number = 50;       // prix par nuit (en €), à adapter selon ta BDD

  today: string = new Date().toISOString().slice(0, 16);
  minEndDate: string = '';
   @Input() place : any;

  reservation = {
    numberOfPeople: 1,
    startDate: '',
    endDate: '',
    specialRequests: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private placesService: PlacesService
  ) {}


  ngOnChanges(changes: SimpleChanges) {
    if (changes['place']) {
     this.placeId = this.place.id

      console.log('Place changed:', this.place);

      // do whatever you need here
    }
  }
  ngOnInit(): void {
  
    this.loadPlace();
    this.loadOccupiedDates(); // clan
  }

  loadPlace(): void {
    console.log(this.placeId)
    this.placesService.getById(this.placeId).subscribe({
      next: (data: Place) => {
        this.place = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onStartDateChange(): void {
    if (!this.reservation.startDate) return;
    const start = new Date(this.reservation.startDate);
    start.setDate(start.getDate() + 1);
    this.minEndDate = start.toISOString().slice(0, 16);
    if (this.reservation.endDate && this.reservation.endDate < this.minEndDate) {
      this.reservation.endDate = '';
    }
    this.checkCapacity();
  }

  onEndDateChange(): void {
    this.checkCapacity();
  }

  checkCapacity(): void {
    if (!this.reservation.startDate || !this.reservation.endDate) return;

    const checkIn  = this.reservation.startDate.split('T')[0];
    const checkOut = this.reservation.endDate.split('T')[0];

    this.capacityLoading = true;
    this.placesService.getAvailableCapacity(this.placeId, checkIn, checkOut).subscribe({
      next: (data: any) => {
        this.totalCapacity     = data.total;
        this.availableCapacity = data.available;
        this.capacityLoading   = false;
        // Ajuste le max du champ
        if (this.reservation.numberOfPeople > this.availableCapacity) {
          this.reservation.numberOfPeople = this.availableCapacity;
        }
      },
      error: () => this.capacityLoading = false
    });
  }

  
  goBack(): void {
    this.router.navigate(['/results']);
  }

  /** Calcule le nombre de nuits */
  getNights(): number {
    if (!this.reservation.startDate || !this.reservation.endDate) return 0;
    const start = new Date(this.reservation.startDate);
    const end   = new Date(this.reservation.endDate);
    const diff  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  /** Calcule le total en DT (Nuits * Prix par nuit) */
  getTotalPrice(): number {
    return this.getNights() * this.pricePerNight;
  }

  /** Lance la page de paiement au lieu de créer directement la réservation */
  goToPayment(): void {
    this.errorMessage = '';

    if (!this.reservation.startDate || !this.reservation.endDate) {
      this.errorMessage = 'Veuillez choisir les dates de début et de fin.';
      return;
    }
    if (this.reservation.numberOfPeople < 1) {
      this.errorMessage = 'Le nombre de chambres doit être au moins 1.';
      return;
    }
    const checkIn  = this.reservation.startDate.split('T')[0];
    const checkOut = this.reservation.endDate.split('T')[0];
    if (this.isDateDisabled(checkIn) || this.isDateDisabled(checkOut)) {
      this.errorMessage = 'Ces dates sont déjà réservées.';
      return;
    }

    // Calculer le montant en millimes (1 TND = 1000 millimes)
    this.paymentAmountCents = this.getTotalPrice() * 1000;
    this.showPayment = true;
  }

  /** Callback quand le paiement Stripe réussit → on crée la réservation */
  onPaymentSuccess(paymentIntentId: string): void {
    const data2 = {
      place:           { id: this.placeId },
      startDate:       this.reservation.startDate + ':00',
      endDate:         this.reservation.endDate   + ':00',
      numberOfPeople:  this.reservation.numberOfPeople,
      specialRequests: this.reservation.specialRequests,
      status:          'CONFIRMED',
      stripePaymentId: paymentIntentId
    };

    this.reservationService.createReservation(data2).subscribe({
      next: (res: any) => {
        this.success = true;
        // Téléchargement du PDF
        if (res && res.id) {
          this.reservationService.downloadInvoice(res.id).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `facture-reservation-${res.id}.pdf`;
            link.click();
          });
        }
        setTimeout(() => this.router.navigate(['/user/homepage']), 5000);
      },
      error: (err: any) => {
        this.errorMessage = 'Paiement réussi mais erreur lors de la réservation.';
        console.error(err);
      }
    });
  }

  /** Callback si le paiement échoue */
  onPaymentFailed(error: string): void {
    this.errorMessage = 'Paiement échoué : ' + error;
    this.showPayment = false;
  }

submitReservation(): void {
  this.errorMessage = '';

  if (!this.reservation.startDate || !this.reservation.endDate) {
    this.errorMessage = 'Veuillez choisir les dates de début et de fin.';
    return;
  }

  if (this.reservation.numberOfPeople < 1) {
    this.errorMessage = 'Le nombre de chambres doit être au moins 1.';
    return;
  }

  // ✅ 🔴 NOUVEAU : bloquer les dates déjà réservées
  const checkIn  = this.reservation.startDate.split('T')[0];
  const checkOut = this.reservation.endDate.split('T')[0];

  if (this.isDateDisabled(checkIn) || this.isDateDisabled(checkOut)) {
    this.errorMessage = "Ces dates sont déjà réservées.";
    return;
  }

  // ✅ Vérification capacité
  this.capacityLoading = true;

  this.placesService.getAvailableCapacity(this.placeId, checkIn, checkOut).subscribe({
    next: (data: any) => {

      this.totalCapacity     = data.total;
      this.availableCapacity = data.available;
      this.capacityLoading   = false;

      // ❌ Complet
      if (this.totalCapacity > 0 && this.availableCapacity === 0) {
        this.errorMessage = 'Cet établissement est complet pour ces dates.';
        return;
      }

      // ❌ Dépasse capacité
      if (this.totalCapacity > 0 && this.reservation.numberOfPeople > this.availableCapacity) {
        this.errorMessage = `Seulement ${this.availableCapacity} chambre(s) disponible(s).`;
        return;
      }

      // ✅ Envoi réservation
      this.isSubmitting = true;

      const data2 = {
        place:           { id: this.placeId },
        startDate:       this.reservation.startDate + ':00',
        endDate:         this.reservation.endDate   + ':00',
        numberOfPeople:  this.reservation.numberOfPeople,
        specialRequests: this.reservation.specialRequests,
        status:          'PENDING'
      };

      this.reservationService.createReservation(data2).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.success = true;
          setTimeout(() => this.router.navigate(['/user/homepage']), 3000);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = 'Erreur lors de la réservation.';
          console.error(err);
        }
      });
    },

    error: () => {
      this.capacityLoading = false;
      this.errorMessage = 'Impossible de vérifier la disponibilité.';
    }
  });
}
loadOccupiedDates(): void {
  this.reservationService.getOccupiedDates(this.placeId).subscribe({
    next: (data) => {
      this.occupiedRanges = data;
      this.generateDisabledDates();
    },
    error: (err) => console.error(err)
  });
} // calan
generateDisabledDates(): void {
  const dates: string[] = [];

  this.occupiedRanges.forEach((range: any) => {
    let current = new Date(range.startDate);
    const end = new Date(range.endDate);

    while (current <= end) {

      // 🔥 FORMAT PROPRE LOCAL (IMPORTANT)
      const formatted =
        current.getFullYear() + '-' +
        String(current.getMonth() + 1).padStart(2, '0') + '-' +
        String(current.getDate()).padStart(2, '0');

      dates.push(formatted);

      current.setDate(current.getDate() + 1);
    }
  });

  this.disabledDates = [...new Set(dates)];

  console.log("DATES BLOQUÉES:", this.disabledDates); // DEBUG
} // cland
isDateDisabled(date: string): boolean {
  return this.disabledDates.includes(date);
} // cland 

}
