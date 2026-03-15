package com.privod.platform.modules.integration.slack.web.dto;

import com.privod.platform.modules.integration.slack.domain.SlackConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlackConfigResponse {

    private UUID id;
    private String workspaceName;
    private String channelId;
    private boolean enabled;
    private boolean webhookConfigured;
    private boolean botTokenConfigured;
    private UUID organizationId;
    private Instant createdAt;
    private Instant updatedAt;

    public static SlackConfigResponse fromEntity(SlackConfig config) {
        return SlackConfigResponse.builder()
                .id(config.getId())
                .workspaceName(config.getWorkspaceName())
                .channelId(config.getChannelId())
                .enabled(config.isEnabled())
                .webhookConfigured(config.getWebhookUrl() != null && !config.getWebhookUrl().isBlank())
                .botTokenConfigured(config.getBotToken() != null && !config.getBotToken().isBlank())
                .organizationId(config.getOrganizationId())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
