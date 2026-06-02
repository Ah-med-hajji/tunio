import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';

declare var Stripe: any;

@Component({
  selector: 'app-stripe-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stripe-wrapper">

      <!-- En-tête du paiement -->
      <div class="payment-header">
        <div class="payment-icon">💳</div>
        <h3 class="payment-title">Paiement sécurisé</h3>
        <p class="payment-subtitle">Propulsé par <span class="stripe-badge">Stripe</span></p>
      </div>

      <!-- Montant -->
      <div class="amount-display">
        <span class="amount-label">Total à payer</span>
        <span class="amount-value">{{ (amount / 1000).toFixed(3) }} DT</span>
        <div class="conversion-info" style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
           (Équivalent approx. de {{ (amount * 0.0003).toFixed(2) }} €)
        </div>
      </div>

      <!-- Loading de l'initialisation -->
      <div *ngIf="isInitializing" class="init-loader">
        <div class="spinner"></div>
        <span>Initialisation du paiement...</span>
      </div>

      <!-- Formulaire Stripe Elements -->
      <div *ngIf="!isInitializing && !paymentSuccess">
        <div id="payment-element" class="stripe-element-container"></div>

        <div *ngIf="paymentError" class="error-message">
          <span>⚠️ {{ paymentError }}</span>
        </div>

        <button
          id="stripe-pay-btn"
          class="pay-button"
          (click)="confirmPayment()"
          [disabled]="isProcessing">
          <span *ngIf="!isProcessing">
            🔒 Payer {{ (amount / 1000).toFixed(3) }} DT
          </span>
          <span *ngIf="isProcessing" class="processing-text">
            <div class="btn-spinner"></div>
            Traitement en cours...
          </span>
        </button>

        <!-- Logos sécurité -->
        <div class="security-badges">
          <span class="badge">🔐 SSL</span>
          <span class="badge">✅ 3D Secure</span>
          <span class="badge">🛡️ PCI DSS</span>
        </div>
      </div>

      <!-- Succès -->
      <div *ngIf="paymentSuccess" class="success-panel">
        <div class="success-icon">✅</div>
        <h3>Paiement réussi !</h3>
        <p>Votre réservation est confirmée.</p>
        <p class="payment-id">ID: {{ paymentIntentId }}</p>
      </div>

    </div>
  `,
  styles: [`
    .stripe-wrapper {
      background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
      border-radius: 20px;
      padding: 28px;
      color: #e2e8f0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      max-width: 480px;
      margin: 0 auto;
    }

    .payment-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .payment-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }

    .payment-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px;
      color: #f8fafc;
    }

    .payment-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }

    .stripe-badge {
      background: #635bff;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }

    .amount-display {
      background: rgba(99, 91, 255, 0.15);
      border: 1px solid rgba(99, 91, 255, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .amount-label {
      font-size: 14px;
      color: #94a3b8;
    }

    .amount-value {
      font-size: 24px;
      font-weight: 700;
      color: #a78bfa;
    }

    .init-loader {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      padding: 24px;
      color: #94a3b8;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #635bff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stripe-element-container {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      min-height: 60px;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 13px;
      color: #fca5a5;
    }

    .pay-button {
      width: 100%;
      background: linear-gradient(135deg, #635bff, #8b5cf6);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .pay-button:hover:not(:disabled) {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99, 91, 255, 0.4);
    }

    .pay-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .processing-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .security-badges {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 16px;
    }

    .badge {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      color: #94a3b8;
    }

    .success-panel {
      text-align: center;
      padding: 20px 0;
    }

    .success-icon {
      font-size: 52px;
      margin-bottom: 12px;
    }

    .success-panel h3 {
      font-size: 20px;
      font-weight: 700;
      color: #4ade80;
      margin: 0 0 8px;
    }

    .success-panel p {
      color: #94a3b8;
      margin: 4px 0;
      font-size: 14px;
    }

    .payment-id {
      font-family: monospace;
      font-size: 11px !important;
      color: #64748b !important;
      word-break: break-all;
    }
  `]
})
export class StripePaymentComponent implements OnInit, OnDestroy {

  /** Montant en millimes (ex: 5000 = 5.000 DT) */
  @Input() amount: number = 0;
  @Input() description: string = 'Réservation TUNÉO';

  @Output() paymentDone = new EventEmitter<string>();   // émet le paymentIntentId
  @Output() paymentFailed = new EventEmitter<string>(); // émet l'erreur

  stripe: any;
  elements: any;
  paymentElement: any;
  clientSecret: string = '';
  paymentIntentId: string = '';

  isInitializing: boolean = true;
  isProcessing: boolean = false;
  paymentSuccess: boolean = false;
  paymentError: string = '';

  private STRIPE_PUBLIC_KEY = 'pk_test_51TWekd2U4Dj8eNJ74fsmH2NPFp7Gi15eC4ORYM56742JUYnDGrUOJiregww4mhtVzgAHfmBI2mCj7Tny42EfWuNx00exeAX8Ak';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadStripeScript().then(() => {
      this.initializePayment();
    });
  }

  ngOnDestroy(): void {
    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }

  /** Charge le script Stripe.js dynamiquement */
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof Stripe !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  /** 1) Crée le PaymentIntent côté backend, puis monte Stripe Elements */
  private initializePayment(): void {
    this.paymentService.createPaymentIntent(this.amount, this.description).subscribe({
      next: (res) => {
        this.clientSecret = res.clientSecret;
        this.paymentIntentId = res.paymentIntentId;
        this.mountStripeElements();
      },
      error: (err) => {
        this.isInitializing = false;
        if (err.error && err.error.error) {
          this.paymentError = 'Erreur Stripe : ' + err.error.error;
        } else {
          this.paymentError = 'Impossible d\'initialiser le paiement. Vérifiez votre connexion.';
        }
        console.error('PaymentIntent error details:', err);
      }
    });
  }

  /** 2) Monte l'interface de paiement Stripe Elements dans le DOM */
  private mountStripeElements(): void {
    this.stripe = Stripe(this.STRIPE_PUBLIC_KEY);

    const appearance = {
      theme: 'night',
      variables: {
        colorPrimary: '#635bff',
        colorBackground: '#1e1e2e',
        colorText: '#e2e8f0',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px'
      }
    };

    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance
    });

    this.paymentElement = this.elements.create('payment');

    // 1) On rend le conteneur visible en désactivant le loader
    this.isInitializing = false;

    // 2) On attend que Angular affiche le div #payment-element dans le DOM
    setTimeout(() => {
      const el = document.getElementById('payment-element');
      if (el) {
        this.paymentElement.mount('#payment-element');
      } else {
        console.error("Élément #payment-element non trouvé dans le DOM");
        // Tentative de secours : on réessaye une fois après un court délai
        setTimeout(() => this.paymentElement.mount('#payment-element'), 200);
      }
    }, 50);
  }

  /** 3) Confirme le paiement quand l'utilisateur clique "Payer" */
  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.isProcessing = true;
    this.paymentError = '';

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: window.location.href  // retour sur la même page
      },
      redirect: 'if_required'
    });

    if (error) {
      this.paymentError = error.message || 'Paiement échoué.';
      this.paymentFailed.emit(error.message);
      this.isProcessing = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      this.paymentSuccess = true;
      this.isProcessing = false;
      this.paymentDone.emit(paymentIntent.id);
    }
  }
}
