package com.privod.platform.modules.integration.slack.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "slack_configs", indexes = {
        @Index(name = "idx_slack_cfg_org", columnList = "organization_id", unique = true),
        @Index(name = "idx_slack_cfg_enabled", columnList = "enabled")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlackConfig extends BaseEntity {

    @Column(name = "workspace_name", length = 255)
    private String workspaceName;

    @Column(name = "webhook_url", length = 1000)
    private String webhookUrl;

    @Column(name = "bot_token", length = 500)
    private String botToken;

    @Column(name = "channel_id", length = 100)
    private String channelId;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
}
