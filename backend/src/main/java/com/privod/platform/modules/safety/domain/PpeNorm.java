package com.privod.platform.modules.safety.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ppe_norms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PpeNorm extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    /** Должность (position / profession) */
    @Column(name = "job_title", nullable = false, length = 300)
    private String jobTitle;

    /** Наименование СИЗ */
    @Column(name = "ppe_name", nullable = false, length = 500)
    private String ppeName;

    /** Норма выдачи (единиц в год) */
    @Column(name = "annual_qty")
    private Integer annualQty;

    /** Срок носки в месяцах */
    @Column(name = "wear_months")
    private Integer wearMonths;

    /** Нормативный документ (Приказ 766н или иной) */
    @Column(name = "norm_document", length = 200)
    private String normDocument;

    /** ГОСТ/ТР на СИЗ */
    @Column(name = "gost_standard", length = 200)
    private String gostStandard;
}
