package com.privod.platform.infrastructure.validation;

/**
 * Utility class for validating Russian taxpayer identification numbers (ИНН).
 * <p>
 * INN can be either 10 digits (for organizations) or 12 digits (for individuals),
 * with checksum validation according to the Russian Federal Tax Service algorithm.
 */
public final class InnValidator {

    private static final int[] WEIGHTS_10 = {2, 4, 10, 3, 5, 9, 4, 6, 8};
    private static final int[] WEIGHTS_12_1 = {7, 2, 4, 10, 3, 5, 9, 4, 6, 8};
    private static final int[] WEIGHTS_12_2 = {3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8};

    private InnValidator() {
        // utility class
    }

    /**
     * Validates a Russian INN string.
     *
     * @param inn the INN value to validate (may be null)
     * @return true if the INN is valid (or null/blank), false otherwise
     */
    public static boolean isValid(String inn) {
        if (inn == null || inn.isBlank()) {
            return true; // null/blank handled by @NotBlank if required
        }

        if (!inn.matches("^\\d{10}$") && !inn.matches("^\\d{12}$")) {
            return false;
        }

        int[] digits = inn.chars().map(c -> c - '0').toArray();

        if (digits.length == 10) {
            return validateChecksum(digits, WEIGHTS_10, 9);
        } else {
            return validateChecksum(digits, WEIGHTS_12_1, 10)
                    && validateChecksum(digits, WEIGHTS_12_2, 11);
        }
    }

    private static boolean validateChecksum(int[] digits, int[] weights, int controlIndex) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += digits[i] * weights[i];
        }
        int controlDigit = sum % 11;
        if (controlDigit > 9) {
            controlDigit = controlDigit % 10;
        }
        return controlDigit == digits[controlIndex];
    }
}
