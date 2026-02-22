package com.privod.platform.modules.isup.web.dto;

import java.util.List;
import java.util.UUID;

public record TriggerTransmissionRequest(
        List<UUID> documentIds
) {
}
