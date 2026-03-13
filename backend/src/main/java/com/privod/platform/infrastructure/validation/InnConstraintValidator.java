package com.privod.platform.infrastructure.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Jakarta Validation constraint validator for the {@link InnValid} annotation.
 * Delegates to {@link InnValidator#isValid(String)}.
 */
public class InnConstraintValidator implements ConstraintValidator<InnValid, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return InnValidator.isValid(value);
    }
}
