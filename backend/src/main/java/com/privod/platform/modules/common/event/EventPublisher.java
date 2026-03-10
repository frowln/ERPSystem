package com.privod.platform.modules.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around Spring's {@link ApplicationEventPublisher} for publishing domain events.
 * Provides structured logging and a single entry point for event publishing across all modules.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final ApplicationEventPublisher publisher;

    /**
     * Publishes a domain event to all registered listeners.
     *
     * @param event the domain event to publish
     */
    public void publish(DomainEvent event) {
        log.debug("Publishing domain event: {} [eventId={}]", event.getClass().getSimpleName(), event.getEventId());
        publisher.publishEvent(event);
    }
}
