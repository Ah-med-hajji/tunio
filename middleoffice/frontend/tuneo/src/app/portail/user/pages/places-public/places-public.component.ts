import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PlacesService } from '../../../admin/core/services/places.service';
import { ReservationService } from '../../core/services/reservation.service';
import { Place } from '../../../admin/core/model/place.model';
import { ReservationComponent } from '../reservation/reservation.component';
import { StripePaymentComponent } from '../stripe-payment/stripe-payment.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
  selector: 'app-places-public',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservationComponent, StripePaymentComponent, ChatbotComponent],
  templateUrl: './places-public.component.html',
  styleUrls: ['./places-public.component.css']
})
export class PlacesPublicComponent implements OnInit {

  places: Place[] = [];
  isLoading = false;
  selectedPlace: Place | null = null;
  showDetail = false;
  showReservationForm = false;
  showTotal: boolean = false;
  selectedCategory: string = '';

  // ✅ STRIPE
  showPaymentModal = false;
  paymentAmountCents = 0;
  pendingPayload: any = null;   // payload en attente d'être envoyé après paiement

  // Calendrier
  currentMonth: Date = new Date();
  calendarDays: Date[] = [];
  occupiedRanges: any[] = [];
  disabledDates: string[] = [];
  today: string = new Date().toISOString().slice(0, 16);

  // Capacité
  totalCapacity: number = 0;
  availableCapacity: number = 0;
  capacityLoading: boolean = false;
  capacityChecked: boolean = false;

  searchParams: any = {
    category: '',
    region: '',
    delegation: '',
    checkIn: '',
    checkOut: ''
  };

  reservation: any = {
    adults: 1,
    children: 0,
    roomType: 'DOUBLE',
    boardType: 'NONE',
    startDate: '',
    endDate: '',
    specialRequests: '',
    withDriver: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private placesService: PlacesService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchParams = {
        category: params['category'] || '',
        region: params['region'] || '',
        delegation: params['delegation'] || '',
        checkIn: params['checkIn'] || '',
        checkOut: params['checkOut'] || '',
      };
      this.loadPlaces();
      this.generateCalendar();
    });
  }

  loadPlaces() {
    this.isLoading = true;
    this.placesService.getByFilters(this.searchParams).subscribe({
      next: (data) => { this.places = data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  viewDetails(place: Place) {
    this.selectedPlace = place;
    this.selectedCategory = place.categorie?.name?.toUpperCase() || '';
    this.showDetail = true;
    this.showReservationForm = false;
    this.resetReservationForm();
    this.resetCapacity();
  }

  closeDetails() {
    this.showDetail = false;
    this.selectedPlace = null;
    this.showReservationForm = false;
    this.disabledDates = [];
    this.resetCapacity();
  }

  goHome() { this.router.navigate(['/user/homepage']); }
  goBack() { this.router.navigate(['/user/homepage']); }

  openReservation() {
    this.showReservationForm = true;
    this.loadOccupiedDates();
  }

  closeReservation() {
    this.showReservationForm = false;
    this.showTotal = false;
    this.resetCapacity();
  }

  // ══ CAPACITÉ ══════════════════════════════════════

  resetCapacity() {
    this.totalCapacity = 0;
    this.availableCapacity = 0;
    this.capacityLoading = false;
    this.capacityChecked = false;
  }

  checkCapacity(): void {
    if (!this.reservation.startDate || !this.selectedPlace?.id) return;

    const checkIn  = this.reservation.startDate.split('T')[0];
    const checkOut = this.reservation.endDate
      ? this.reservation.endDate.split('T')[0]
      : checkIn;

    this.capacityLoading = true;
    this.capacityChecked = false;

    this.placesService.getAvailableCapacity(
      this.selectedPlace.id, checkIn, checkOut
    ).subscribe({
      next: (data: any) => {
        this.totalCapacity     = data.total;
        this.availableCapacity = data.available;
        this.capacityLoading   = false;
        this.capacityChecked   = true;
      },
      error: () => {
        this.capacityLoading = false;
        this.capacityChecked = false;
      }
    });
  }

  get isCapacityFull(): boolean {
    return this.capacityChecked && this.totalCapacity > 0 && this.availableCapacity === 0;
  }

  get capacityPercent(): number {
    if (!this.totalCapacity) return 0;
    return Math.round((this.availableCapacity / this.totalCapacity) * 100);
  }

  get capacityColor(): string {
    if (this.capacityPercent > 50) return '#86B817';
    if (this.capacityPercent > 20) return '#f59e0b';
    return '#ef4444';
  }

  // ══ RÉSERVATION ═══════════════════════════════════

  /** Formate une date datetime-local en "yyyy-MM-dd'T'HH:mm:ss" */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.length === 16 ? dateStr + ':00' : dateStr;
  }

  /** Clic sur "Confirmer" → ouvre le modal Stripe */
  submitReservation() {
    console.log('--- SUBMIT RESERVATION ---');
    if (!this.selectedPlace) return;

    if (!this.reservation.startDate || !this.reservation.endDate) {
      alert('Veuillez sélectionner les dates de début et de fin.');
      return;
    }

    if (this.isCapacityFull) {
      alert('Cet établissement est complet pour ces dates.');
      return;
    }

    // Préparer le payload (sera envoyé après paiement réussi)
    this.pendingPayload = {
      place: { id: this.selectedPlace.id },
      startDate: this.formatDate(this.reservation.startDate),
      endDate:   this.formatDate(this.reservation.endDate),
      specialRequests: this.reservation.specialRequests,
      status: 'CONFIRMED',
      numberOfPeople: this.reservation.adults + (this.reservation.children || 0)
    };

    if (this.selectedCategory.includes('HOTEL')) {
      this.pendingPayload.adults    = this.reservation.adults;
      this.pendingPayload.children  = this.reservation.children;
      this.pendingPayload.roomType  = this.reservation.roomType;
      this.pendingPayload.boardType = this.reservation.boardType;
    } else if (this.selectedCategory.includes('RESTAURANT') ||
               this.selectedCategory.includes('CAFE')) {
      this.pendingPayload.adults = this.reservation.adults;
    }

    // Calculer le montant en millimes (1 TND = 1000 millimes)
    const total = this.getTotalPrice();
    console.log('Total calculé:', total);
    this.paymentAmountCents = total > 0 ? Math.round(total * 1000) : 50000; // fallback 50 DT
    console.log('Montant en centimes:', this.paymentAmountCents);

    // Ouvrir le modal de paiement Stripe
    this.showPaymentModal = true;
    console.log('Modal Stripe ouvert:', this.showPaymentModal);
  }

  /** Appelé quand Stripe confirme le paiement → on crée la réservation */
  onPaymentSuccess(paymentIntentId: string): void {
    if (!this.pendingPayload) return;

    this.pendingPayload.stripePaymentId = paymentIntentId;

    this.reservationService.createReservation(this.pendingPayload).subscribe({
      next: (res: any) => {
        this.showPaymentModal = false;
        this.pendingPayload = null;
        alert('🎉 Paiement et réservation confirmés !');
        
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
        
        this.closeReservation();
      },
      error: (err: any) => {
        console.error('Erreur réservation après paiement:', err);
        alert('⚠️ Paiement reçu mais erreur lors de la réservation. Contactez le support.');
      }
    });
  }

  /** Appelé si le paiement Stripe échoue */
  onPaymentFailed(error: string): void {
    this.showPaymentModal = false;
    alert('❌ Paiement refusé : ' + error);
  }

  /** Ferme le modal sans payer */
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.pendingPayload = null;
  }

  resetReservationForm() {
    this.reservation = {
      adults: 1, children: 0,
      roomType: 'DOUBLE', boardType: 'NONE',
      startDate: '', endDate: '',
      specialRequests: '', withDriver: false
    };
    this.showTotal = false;
  }

  // ══ CALCULS ═══════════════════════════════════════

  getNights(): number {
    if (!this.reservation.startDate || !this.reservation.endDate) return 0;
    const diff = new Date(this.reservation.endDate).getTime()
               - new Date(this.reservation.startDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

 getTotalPrice(): number {
  const nights = this.getNights();
  if (!this.selectedPlace) return 0;

  const factor = nights > 0 ? nights : 1;

  if (this.selectedCategory.includes('HOTEL')) {
    const pricePerRoom = (this.reservation.roomType === 'SINGLE')
      ? Number(this.selectedPlace.priceSingle || 0)
      : Number(this.selectedPlace.priceDouble || 0);

    const numberOfPeople = (this.reservation.adults || 1) + (this.reservation.children || 0);

    return pricePerRoom * factor * numberOfPeople; // ← nuits × prix × personnes
  }

  // Restaurants, cafés, etc. → inchangé (pas de multiplication par personnes)
  const price = Number(this.selectedPlace.pricePerDay || this.selectedPlace.cafePrice || 0);
  return price * factor;
}

  // ══ DATES RÉSERVÉES ═══════════════════════════════

  loadOccupiedDates(): void {
    if (!this.selectedPlace?.id) return;
    (this.reservationService.getOccupiedDates(this.selectedPlace.id) as any).subscribe({
      next: (data: any[]) => {
        this.occupiedRanges = data;
        this.generateDisabledDates();
      },
      error: (err: any) => {
        console.error('Erreur chargement dates:', err);
        this.disabledDates = [];
      }
    });
  }

  generateDisabledDates(): void {
    const dates: string[] = [];
    this.occupiedRanges.forEach((range: any) => {
      let current = new Date(range.startDate);
      const end   = new Date(range.endDate);
      while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }
    });
    this.disabledDates = [...new Set(dates)];
    this.generateCalendar();
  }

  isDateReserved(date: string): boolean {
    return this.disabledDates.includes(date);
  }

  // ══ CALENDRIER ════════════════════════════════════

  generateCalendar(): void {
    const year  = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    this.calendarDays = [];
    const lastDay = new Date(year, month + 1, 0);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      this.calendarDays.push(new Date(year, month, d));
    }
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1, 1
    );
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1, 1
    );
    this.generateCalendar();
  }

  isReserved(date: Date): boolean {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return this.disabledDates.includes(`${y}-${m}-${d}`);
  }

  isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  isSelectedDay(date: Date): boolean {
    if (!this.reservation.startDate) return false;
    const sel = this.reservation.startDate.split('T')[0];
    const y   = date.getFullYear();
    const m   = String(date.getMonth() + 1).padStart(2, '0');
    const d   = String(date.getDate()).padStart(2, '0');
    return sel === `${y}-${m}-${d}`;
  }

  /** Indique si ce jour est la date de départ sélectionnée */
  isEndDay(date: Date): boolean {
    if (!this.reservation.endDate) return false;
    const sel = this.reservation.endDate.split('T')[0];
    const y   = date.getFullYear();
    const m   = String(date.getMonth() + 1).padStart(2, '0');
    const d   = String(date.getDate()).padStart(2, '0');
    return sel === `${y}-${m}-${d}`;
  }

  /** Clic sur un jour du calendrier :
   *  - 1er clic : définit la date d'arrivée
   *  - 2ème clic : définit la date de départ (si après arrivée)
   *  - clic sur une date déjà remplie : réinitialise tout
   */
  onCalendarDayClick(date: Date): void {
    if (this.isReserved(date) || this.isPast(date)) return;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}T12:00`;

    if (!this.reservation.startDate || (this.reservation.startDate && this.reservation.endDate)) {
      // Premier clic ou réinitialisation : on définit l'arrivée
      this.reservation.startDate = dateStr;
      this.reservation.endDate = '';
      this.resetCapacity();
    } else {
      // Deuxième clic : on définit le départ
      const startDate = new Date(this.reservation.startDate);
      if (date <= startDate) {
        // Si le départ est avant ou égal à l'arrivée, on redéfinit l'arrivée
        this.reservation.startDate = dateStr;
        this.reservation.endDate = '';
        this.resetCapacity();
      } else {
        this.reservation.endDate = dateStr;
        this.checkCapacity();
      }
    }
  }

  getBlankDays(): any[] {
    const year  = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    let startDay = new Date(year, month, 1).getDay();
    startDay = (startDay === 0) ? 6 : startDay - 1;
    return Array(startDay).fill(null);
  }
}