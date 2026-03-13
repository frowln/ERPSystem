package com.privod.platform.infrastructure.security;

import com.privod.platform.modules.permission.domain.AccessOperation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce model-level access checks via the permission matrix.
 * When placed on a controller method, the AOP aspect will verify that the
 * current user's permission groups grant the specified operation on the model.
 *
 * <p>If the user has no group assignments, access is allowed (backwards-compatible).
 * If the user belongs to at least one group but none grant the required permission, 403 is returned.</p>
 *
 * <p>Example usage:</p>
 * <pre>
 * {@literal @}CheckModelAccess(model = "Project", operation = AccessOperation.CREATE)
 * {@literal @}PostMapping
 * public ResponseEntity<?> create(...) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckModelAccess {
    /** The model/entity name as stored in model_access_rules.model_name */
    String model();

    /** The operation to check */
    AccessOperation operation();
}
