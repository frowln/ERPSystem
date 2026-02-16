package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.HandoverStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateHandoverPackageRequest(
        @Size(max = 50)
        String packageNumber,

        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        HandoverStatus status,

        @Size(max = 500)
        String recipientOrganization,

        UUID recipientContactId,

        UUID preparedById,

        LocalDate preparedDate,

        LocalDate handoverDate,

        LocalDate acceptedDate,

        UUID acceptedById,

        String documentIds,

        String drawingIds,

        String certificateIds,

        String manualIds,

        String rejectionReason
) {
}
