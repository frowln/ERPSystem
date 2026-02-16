package com.privod.platform.modules.settings.domain;

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

import java.time.LocalDate;

@Entity
@Table(name = "number_sequences", indexes = {
        @Index(name = "idx_number_sequence_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NumberSequence extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "prefix", length = 20)
    private String prefix;

    @Column(name = "suffix", length = 20)
    private String suffix;

    @Column(name = "next_number", nullable = false)
    @Builder.Default
    private Long nextNumber = 1L;

    @Column(name = "step", nullable = false)
    @Builder.Default
    private Integer step = 1;

    @Column(name = "padding", nullable = false)
    @Builder.Default
    private Integer padding = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "reset_period", nullable = false, length = 20)
    @Builder.Default
    private ResetPeriod resetPeriod = ResetPeriod.NEVER;

    @Column(name = "last_reset_date")
    private LocalDate lastResetDate;

    /**
     * Formats the current number using prefix, padding, and suffix.
     * Does NOT increment the counter.
     */
    public String formatCurrentNumber() {
        String formatted = String.format("%0" + padding + "d", nextNumber);
        StringBuilder sb = new StringBuilder();
        if (prefix != null) {
            sb.append(prefix);
        }
        sb.append(formatted);
        if (suffix != null) {
            sb.append(suffix);
        }
        return sb.toString();
    }

    /**
     * Increments the counter by step.
     */
    public void increment() {
        this.nextNumber += this.step;
    }
}
