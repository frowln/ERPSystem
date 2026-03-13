package com.privod.platform.infrastructure.finance;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Centralised VAT (НДС) calculation utility.
 * Default rate is 20% per Russian Tax Code Art. 164.
 */
public final class VatCalculator {

    public static final BigDecimal DEFAULT_RATE = new BigDecimal("20.00");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private VatCalculator() {
    }

    /**
     * Calculate VAT amount from a base amount and rate.
     * Formula: amount × rate / 100, rounded HALF_UP to 2 decimal places.
     */
    public static BigDecimal vatAmount(BigDecimal amount, BigDecimal vatRate) {
        if (amount == null || vatRate == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(vatRate).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate VAT amount using default 20% rate.
     */
    public static BigDecimal vatAmount(BigDecimal amount) {
        return vatAmount(amount, DEFAULT_RATE);
    }

    /**
     * Resolve VAT rate: return provided value or default 20%.
     */
    public static BigDecimal resolveRate(BigDecimal provided) {
        return provided != null ? provided : DEFAULT_RATE;
    }

    /**
     * Extract VAT from an amount that ALREADY INCLUDES VAT (расчётная ставка).
     * НК РФ ст. 164 п. 4: НДС = сумма × ставка / (100 + ставка).
     * For 20%: НДС = totalWithVat × 20/120.
     * For 10%: НДС = totalWithVat × 10/110.
     *
     * @param totalWithVat сумма, включающая НДС
     * @param vatRate      ставка НДС в процентах (например, 20.00)
     * @return выделенная сумма НДС, округлённая до 2 знаков
     */
    public static BigDecimal extractVat(BigDecimal totalWithVat, BigDecimal vatRate) {
        if (totalWithVat == null || vatRate == null || vatRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        // Расчётная ставка: vatRate / (100 + vatRate)
        BigDecimal denominator = HUNDRED.add(vatRate);
        return totalWithVat.multiply(vatRate).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /**
     * Extract VAT from amount with VAT using default 20% rate.
     */
    public static BigDecimal extractVat(BigDecimal totalWithVat) {
        return extractVat(totalWithVat, DEFAULT_RATE);
    }

    /**
     * Calculate net amount (without VAT) from an amount that includes VAT.
     * netAmount = totalWithVat - extractVat(totalWithVat, vatRate)
     */
    public static BigDecimal netAmount(BigDecimal totalWithVat, BigDecimal vatRate) {
        return totalWithVat.subtract(extractVat(totalWithVat, vatRate));
    }

    /**
     * Map VAT rate to 1С-compatible string: "НДС20", "НДС10", "БезНДС".
     */
    public static String rateToOneCString(BigDecimal vatRate) {
        if (vatRate == null || vatRate.compareTo(BigDecimal.ZERO) == 0) {
            return "БезНДС";
        }
        int rate = vatRate.intValue();
        return switch (rate) {
            case 10 -> "НДС10";
            case 20 -> "НДС20";
            default -> "НДС" + rate;
        };
    }
}
