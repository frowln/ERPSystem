package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class for all domain events in the PRIVOD platform.
 * Provides unique event identification and timestamp tracking.
 */
@Getter
public abstract class DomainEvent {

    private final UUID eventId = UUID.randomUUID();
    private final Instant occurredAt = Instant.now();
}
