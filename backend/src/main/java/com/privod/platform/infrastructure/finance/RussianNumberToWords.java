package com.privod.platform.infrastructure.finance;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Converts a monetary amount to its Russian word representation.
 * Required by Постановление Правительства №1137 (invoice), ФЗ-402 (accounting documents).
 * Example: 12 345.67 → "Двенадцать тысяч триста сорок пять рублей 67 копеек"
 */
public final class RussianNumberToWords {

    private RussianNumberToWords() {
    }

    private static final String[] ONES_MASC = {
            "", "один", "два", "три", "четыре", "пять", "шесть",
            "семь", "восемь", "девять"
    };

    private static final String[] ONES_FEM = {
            "", "одна", "две", "три", "четыре", "пять", "шесть",
            "семь", "восемь", "девять"
    };

    private static final String[] TEENS = {
            "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
            "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"
    };

    private static final String[] TENS = {
            "", "десять", "двадцать", "тридцать", "сорок", "пятьдесят",
            "шестьдесят", "семьдесят", "восемьдесят", "девяносто"
    };

    private static final String[] HUNDREDS = {
            "", "сто", "двести", "триста", "четыреста", "пятьсот",
            "шестьсот", "семьсот", "восемьсот", "девятьсот"
    };

    // [nominative singular, genitive singular, genitive plural]
    private static final String[][] THOUSANDS = {
            {"", "", ""},
            {"тысяча", "тысячи", "тысяч"},        // 10^3
            {"миллион", "миллиона", "миллионов"},   // 10^6
            {"миллиард", "миллиарда", "миллиардов"} // 10^9
    };

    private static final String[] RUBLES = {"рубль", "рубля", "рублей"};
    private static final String[] KOPECKS = {"копейка", "копейки", "копеек"};

    /**
     * Convert amount to Russian text representation.
     *
     * @param amount monetary amount (e.g. 12345.67)
     * @return e.g. "Двенадцать тысяч триста сорок пять рублей 67 копеек"
     */
    public static String convert(BigDecimal amount) {
        if (amount == null) {
            return "Ноль рублей 00 копеек";
        }
        amount = amount.setScale(2, RoundingMode.HALF_UP);

        long rubles = amount.longValue();
        int kopecks = amount.subtract(BigDecimal.valueOf(rubles)).multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP).intValue();

        String rublesText;
        if (rubles == 0) {
            rublesText = "Ноль";
        } else {
            rublesText = convertLong(rubles);
            // Capitalise first letter
            rublesText = rublesText.substring(0, 1).toUpperCase() + rublesText.substring(1);
        }

        String rubleWord = pluralize(rubles, RUBLES);
        String kopeckWord = pluralize(kopecks, KOPECKS);

        return String.format("%s %s %02d %s", rublesText, rubleWord, kopecks, kopeckWord);
    }

    /**
     * Convenience overload for double values.
     */
    public static String convert(double amount) {
        return convert(BigDecimal.valueOf(amount));
    }

    private static String convertLong(long n) {
        if (n == 0) return "";

        StringBuilder sb = new StringBuilder();

        // Split into groups of 3 digits
        long[] groups = new long[4];
        long remainder = n;
        for (int i = 0; i < 4; i++) {
            groups[i] = remainder % 1000;
            remainder /= 1000;
        }

        // Process from highest to lowest group
        for (int i = 3; i >= 0; i--) {
            if (groups[i] == 0) continue;
            // Thousands (group 1) uses feminine gender; rest masculine
            boolean feminine = (i == 1);
            String groupText = convertGroup((int) groups[i], feminine);
            sb.append(groupText);
            if (i > 0) {
                sb.append(" ").append(pluralize(groups[i], THOUSANDS[i])).append(" ");
            }
        }

        return sb.toString().trim().replaceAll("\\s+", " ");
    }

    private static String convertGroup(int n, boolean feminine) {
        if (n == 0) return "";
        StringBuilder sb = new StringBuilder();

        int hundreds = n / 100;
        int remainder = n % 100;

        if (hundreds > 0) {
            sb.append(HUNDREDS[hundreds]).append(" ");
        }

        if (remainder >= 10 && remainder <= 19) {
            sb.append(TEENS[remainder - 10]);
        } else {
            int tens = remainder / 10;
            int ones = remainder % 10;
            if (tens > 0) sb.append(TENS[tens]).append(ones > 0 ? " " : "");
            if (ones > 0) sb.append(feminine ? ONES_FEM[ones] : ONES_MASC[ones]);
        }

        return sb.toString().trim();
    }

    /**
     * Selects the correct Russian noun form based on the number.
     * Rules: 1 → form[0], 2-4 → form[1], 5-20 → form[2], then repeats for 21+.
     */
    private static String pluralize(long n, String[] forms) {
        long absN = Math.abs(n) % 100;
        long lastTwo = absN;
        long lastOne = absN % 10;

        if (lastTwo >= 11 && lastTwo <= 19) return forms[2];
        if (lastOne == 1) return forms[0];
        if (lastOne >= 2 && lastOne <= 4) return forms[1];
        return forms[2];
    }
}
