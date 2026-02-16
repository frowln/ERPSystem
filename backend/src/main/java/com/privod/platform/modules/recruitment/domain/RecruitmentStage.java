package com.privod.platform.modules.recruitment.domain;

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

@Entity
@Table(name = "recruitment_stages", indexes = {
        @Index(name = "idx_recruitment_stage_sequence", columnList = "sequence")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentStage extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "sequence", nullable = false)
    private int sequence;

    @Column(name = "fold_state", length = 50)
    private String foldState;

    @Column(name = "is_hired", nullable = false)
    @Builder.Default
    private boolean isHired = false;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
}
