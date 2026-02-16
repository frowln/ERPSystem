package com.privod.platform.modules.accounting.domain;

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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "fixed_assets", indexes = {
        @Index(name = "idx_fixed_asset_org", columnList = "organization_id"),
        @Index(name = "idx_fixed_asset_code", columnList = "code"),
        @Index(name = "idx_fixed_asset_inventory", columnList = "inventory_number"),
        @Index(name = "idx_fixed_asset_account", columnList = "account_id"),
        @Index(name = "idx_fixed_asset_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FixedAsset extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "inventory_number", nullable = false, length = 50)
    private String inventoryNumber;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "purchase_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal purchaseAmount;

    @Column(name = "useful_life_months", nullable = false)
    private Integer usefulLifeMonths;

    @Enumerated(EnumType.STRING)
    @Column(name = "depreciation_method", nullable = false, length = 20)
    @Builder.Default
    private DepreciationMethod depreciationMethod = DepreciationMethod.LINEAR;

    @Column(name = "current_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal currentValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FixedAssetStatus status = FixedAssetStatus.DRAFT;

    public boolean canTransitionTo(FixedAssetStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    /**
     * Calculates monthly depreciation based on the configured method.
     * @param monthsElapsed months already depreciated (for non-linear methods)
     */
    public BigDecimal calculateMonthlyDepreciation(int monthsElapsed) {
        if (usefulLifeMonths == null || usefulLifeMonths <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal amount = purchaseAmount != null ? purchaseAmount : BigDecimal.ZERO;

        return switch (depreciationMethod) {
            case LINEAR ->
                    amount.divide(new BigDecimal(usefulLifeMonths), 2, RoundingMode.HALF_UP);
            case REDUCING_BALANCE -> {
                // Double-declining balance: rate = 2 / usefulLifeMonths * currentValue
                BigDecimal rate = BigDecimal.valueOf(2).divide(new BigDecimal(usefulLifeMonths), 10, RoundingMode.HALF_UP);
                BigDecimal remaining = currentValue != null ? currentValue : amount;
                yield remaining.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            }
            case SUM_OF_YEARS -> {
                // Sum-of-years digits: remaining years / sum * purchaseAmount / 12
                int totalYears = (usefulLifeMonths + 11) / 12;
                int sumOfYears = totalYears * (totalYears + 1) / 2;
                int elapsedYears = monthsElapsed / 12;
                int remainingYears = Math.max(1, totalYears - elapsedYears);
                BigDecimal yearlyAmount = amount.multiply(new BigDecimal(remainingYears))
                        .divide(new BigDecimal(sumOfYears), 10, RoundingMode.HALF_UP);
                yield yearlyAmount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
            }
        };
    }

    public BigDecimal calculateMonthlyDepreciation() {
        return calculateMonthlyDepreciation(0);
    }
}
