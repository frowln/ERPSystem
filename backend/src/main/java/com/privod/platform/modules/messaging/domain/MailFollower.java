package com.privod.platform.modules.messaging.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "mail_followers", indexes = {
        @Index(name = "idx_mail_follower_record", columnList = "model_name, record_id"),
        @Index(name = "idx_mail_follower_user", columnList = "user_id"),
        @Index(name = "idx_mail_follower_channel", columnList = "channel_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_mail_follower_record_user",
                columnNames = {"model_name", "record_id", "user_id"})
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailFollower extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "channel_id")
    private UUID channelId;

    @Column(name = "subtype_ids", columnDefinition = "TEXT")
    private String subtypeIds;
}
