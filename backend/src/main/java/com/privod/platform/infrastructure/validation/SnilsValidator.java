package com.privod.platform.infrastructure.validation;

/**
 * Utility class for validating Russian insurance individual account numbers (СНИЛС).
 * <p>
 * SNILS consists of 11 digits, commonly formatted as XXX-XXX-XXX XX.
 * The last two digits are a checksum computed as the sum of each of the first 9 digits
 * multiplied by (9 - position), taken modulo 101, then modulo 100.
 */
public final class SnilsValidator {

    private SnilsValidator() {
        // utility class
    }

    /**
     * Validates a Russian SNILS string.
     *
     * @param snils the SNILS value to validate (may be null); dashes and spaces are stripped before validation
     * @return true if the SNILS is valid (or null/blank), false otherwise
     */
    public static boolean isValid(String snils) {
        if (snils == null || snils.isBlank()) {
            return true; // null/blank handled by @NotBlank if required
        }

        // Strip formatting characters (dashes, spaces)
        String digits = snils.replaceAll("[\\s\\-]", "");

        if (!digits.matches("^\\d{11}$")) {
            return false;
        }

        int[] d = digits.chars().map(c -> c - '0').toArray();

        // Compute checksum: sum of digit[i] * (9 - i) for i = 0..8
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += d[i] * (9 - i);
        }

        int controlNumber = sum % 101;
        if (controlNumber == 100) {
            controlNumber = 0;
        }

        int actualControl = d[9] * 10 + d[10];
        return controlNumber == actualControl;
    }
}
