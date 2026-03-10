package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.util.UUID;

/**
 * Published when a new project is created.
 * Listeners may use this to auto-create budgets, default task stages, notification channels, etc.
 */
@Getter
public class ProjectCreatedEvent extends DomainEvent {

    private final UUID projectId;
    private final UUID organizationId;
    private final String name;

    public ProjectCreatedEvent(UUID projectId, UUID organizationId, String name) {
        this.projectId = projectId;
        this.organizationId = organizationId;
        this.name = name;
    }
}
