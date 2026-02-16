package com.privod.platform.modules.messaging.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mail_activity_types", indexes = {
        @Index(name = "idx_mail_activity_type_name", columnList = "name"),
        @Index(name = "idx_mail_activity_type_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailActivityType extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    @Builder.Default
    private ActivityCategory category = ActivityCategory.DEFAULT;

    @Column(name = "delay_count", nullable = false)
    @Builder.Default
    private int delayCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "delay_unit", nullable = false, length = 10)
    @Builder.Default
    private ActivityDelayUnit delayUnit = ActivityDelayUnit.DAYS;

    @Column(name = "icon", length = 100)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(name = "decoration_type", length = 20)
    private ActivityDecorationType decorationType;
}
