package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.TicketTemplate;
import java.time.Instant;
import java.util.UUID;

public record TicketTemplateResponse(
    UUID id,
    String name,
    String description,
    String category,
    String defaultPriority,
    String bodyTemplate,
    Boolean isActive,
    Instant createdAt
) {
    public static TicketTemplateResponse fromEntity(TicketTemplate t) {
        return new TicketTemplateResponse(
            t.getId(), t.getName(), t.getDescription(),
            t.getCategory(), t.getDefaultPriority(), t.getBodyTemplate(),
            t.getIsActive(), t.getCreatedAt()
        );
    }
}
