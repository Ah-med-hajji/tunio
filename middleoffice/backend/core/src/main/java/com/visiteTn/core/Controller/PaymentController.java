package com.visiteTn.core.Controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.public.key}")
    private String stripePublicKey;

    /**
     * POST /api/payment/create-payment-intent
     * Body: { "amount": 5000, "currency": "eur", "description": "..." }
     * amount est en centimes (5000 = 50.00 EUR)
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(
            @RequestBody PaymentRequest request) {

        Stripe.apiKey = stripeSecretKey;

        // Taux de conversion : 1 TND = 0.30 EUR (approx)
        double conversionRate = 0.30;
        
        // Le montant reçu est en millimes (1/1000 de TND)
        // On le convertit en centimes EUR (1/100 de EUR)
        // Formule : (millimes / 1000) * conversionRate * 100 => millimes * conversionRate / 10
        long amountInEurCentimes = Math.round(request.getAmount() * conversionRate / 10.0);

        System.out.println("--- Stripe Payment (Conversion TND -> EUR) ---");
        System.out.println("Amount TND (millimes): " + request.getAmount());
        System.out.println("Amount EUR (centimes): " + amountInEurCentimes);

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInEurCentimes)
                    .setCurrency("eur")
                    .setDescription(request.getDescription() != null
                            ? request.getDescription() : "Réservation TUNÉO (Conversion DT/EUR)")
                    .addPaymentMethodType("card")
                    .build();

            System.out.println("Sending to Stripe: Amount=" + params.getAmount() + ", Currency=" + params.getCurrency());

            PaymentIntent paymentIntent = PaymentIntent.create(params);
            System.out.println("PaymentIntent created: " + paymentIntent.getId());

            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", paymentIntent.getClientSecret());
            response.put("paymentIntentId", paymentIntent.getId());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            System.err.println("Stripe Error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("code", e.getCode());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/payment/config
     * Retourne la clé publique Stripe pour le frontend
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("publicKey", stripePublicKey);
        return ResponseEntity.ok(config);
    }

    // DTO interne
    public static class PaymentRequest {
        private long amount;
        private String currency;
        private String description;

        public long getAmount() { return amount; }
        public void setAmount(long amount) { this.amount = amount; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
