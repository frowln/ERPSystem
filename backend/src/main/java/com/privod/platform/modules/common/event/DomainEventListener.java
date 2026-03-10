package com.privod.platform.modules.common.event;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker annotation for methods that handle domain events.
 * <p>
 * Use in combination with Spring's {@link org.springframework.context.event.EventListener}
 * or {@link org.springframework.transaction.event.TransactionalEventListener} to indicate
 * that a method is a domain event handler.
 * <p>
 * Example usage:
 * <pre>
 * {@code
 * @DomainEventListener
 * @TransactionalEventListener
 * public void onProjectCreated(ProjectCreatedEvent event) {
 *     // handle event
 * }
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DomainEventListener {
}
