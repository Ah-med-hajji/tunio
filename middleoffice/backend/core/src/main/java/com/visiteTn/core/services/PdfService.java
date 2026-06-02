package com.visiteTn.core.services;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.visiteTn.core.entities.Reservation;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Service
public class PdfService {

    public byte[] generateReservationPdf(Reservation reservation) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);

        document.open();

        // Polices
        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
        Font fontSubtitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.GRAY);
        Font fontBody = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);
        Font fontLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);

        // Titre
        Paragraph title = new Paragraph("FACTURE DE RÉSERVATION", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph company = new Paragraph("TUNÉO - Visite TN", fontSubtitle);
        company.setAlignment(Element.ALIGN_CENTER);
        company.setSpacingAfter(20);
        document.add(company);

        document.add(new Paragraph(" ")); // Saut de ligne

        // Infos Réservation
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(10f);

        addTableCell(table, "Référence :", fontLabel);
        addTableCell(table, "#RES-" + reservation.getId(), fontBody);

        addTableCell(table, "Établissement :", fontLabel);
        addTableCell(table, reservation.getPlace().getName(), fontBody);

        addTableCell(table, "Client (ID) :", fontLabel);
        addTableCell(table, reservation.getKeycloakUserId(), fontBody);

        addTableCell(table, "Nombre de personnes :", fontLabel);
        addTableCell(table, String.valueOf(reservation.getNumberOfPeople()), fontBody);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        addTableCell(table, "Date d'arrivée :", fontLabel);
        addTableCell(table, reservation.getStartDate().format(formatter), fontBody);

        addTableCell(table, "Date de départ :", fontLabel);
        addTableCell(table, reservation.getEndDate().format(formatter), fontBody);

        long nights = ChronoUnit.DAYS.between(
                reservation.getStartDate().toLocalDate(),
                reservation.getEndDate().toLocalDate()
        );
        if (nights == 0) nights = 1; // Minimum 1 jour

        addTableCell(table, "Durée :", fontLabel);
        addTableCell(table, nights + " nuit(s)", fontBody);

        addTableCell(table, "Statut :", fontLabel);
        addTableCell(table, reservation.getStatus().toString(), fontBody);

        addTableCell(table, "ID Paiement Stripe :", fontLabel);
        addTableCell(table, reservation.getStripePaymentId() != null ? reservation.getStripePaymentId() : "N/A", fontBody);

        document.add(table);

        // Montant Total
        document.add(new Paragraph(" "));

        double pricePerNight = 0;
        if (reservation.getPlace().getPriceDouble() != null) {
            pricePerNight = reservation.getPlace().getPriceDouble().doubleValue();
        } else if (reservation.getPlace().getPriceSingle() != null) {
            pricePerNight = reservation.getPlace().getPriceSingle().doubleValue();
        } else if (reservation.getPlace().getPricePerDay() != null) {
            pricePerNight = reservation.getPlace().getPricePerDay().doubleValue();
        }

        double totalAmount = pricePerNight * nights;

        Paragraph total = new Paragraph(
                "MONTANT TOTAL PAYÉ : " + String.format("%.3f", totalAmount) + " TND",
                fontTitle
        );
        total.setAlignment(Element.ALIGN_RIGHT);
        total.setSpacingBefore(20);
        document.add(total);

        document.add(new Paragraph(" "));
        Paragraph footer = new Paragraph("Merci de votre confiance. Bon voyage avec TUNÉO !", fontSubtitle);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER); // ✅ Plus ambigu, pointe vers com.lowagie.text.Rectangle
        cell.setPadding(5);
        table.addCell(cell);
    }
}
