package com.privod.platform.infrastructure.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that the annotated string is a valid Russian INN (ИНН).
 * <p>
 * A valid INN is either 10 digits (organization) or 12 digits (individual)
 * with correct checksum digits. Null and blank values are considered valid
 * (use {@link jakarta.validation.constraints.NotBlank} to enforce presence).
 */
@Documented
@Constraint(validatedBy = InnConstraintValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface InnValid {

    String message() default "Некорректный ИНН: должен содержать 10 или 12 цифр с верной контрольной суммой";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
