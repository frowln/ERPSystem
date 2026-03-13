package com.privod.platform.infrastructure.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that the annotated string is a valid Russian SNILS (СНИЛС).
 * <p>
 * A valid SNILS is 11 digits (formatted as XXX-XXX-XXX XX or plain digits)
 * with correct checksum per the Russian Pension Fund algorithm.
 * Null and blank values are considered valid
 * (use {@link jakarta.validation.constraints.NotBlank} to enforce presence).
 */
@Documented
@Constraint(validatedBy = SnilsConstraintValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSnils {

    String message() default "Некорректный СНИЛС: должен содержать 11 цифр с верной контрольной суммой";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
