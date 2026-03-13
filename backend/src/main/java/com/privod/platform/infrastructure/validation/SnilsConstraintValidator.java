package com.privod.platform.infrastructure.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Jakarta Validation constraint validator for the {@link ValidSnils} annotation.
 * Delegates to {@link SnilsValidator#isValid(String)}.
 */
public class SnilsConstraintValidator implements ConstraintValidator<ValidSnils, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return SnilsValidator.isValid(value);
    }
}
