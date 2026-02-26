package com.privod.platform.modules.integration.pricing.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.pricing.domain.PriceIndex;
import com.privod.platform.modules.integration.pricing.domain.PricingDatabase;
import com.privod.platform.modules.integration.pricing.domain.PricingDatabaseType;
import com.privod.platform.modules.integration.pricing.repository.PriceIndexRepository;
import com.privod.platform.modules.integration.pricing.repository.PriceRateRepository;
import com.privod.platform.modules.integration.pricing.repository.PricingDatabaseRepository;
import com.privod.platform.modules.integration.pricing.web.dto.ImportQuarterlyPriceIndicesRequest;
import com.privod.platform.modules.integration.pricing.web.dto.QuarterlyIndexImportResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private PricingDatabaseRepository databaseRepository;
    @Mock
    private PriceRateRepository rateRepository;
    @Mock
    private PriceIndexRepository indexRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private PricingService pricingService;

    private UUID databaseId;
    private PricingDatabase pricingDatabase;

    @BeforeEach
    void setUp() {
        databaseId = UUID.randomUUID();
        pricingDatabase = PricingDatabase.builder()
                .name("FSNB 2022")
                .type(PricingDatabaseType.GESN)
                .region("Москва")
                .baseYear(2001)
                .active(true)
                .build();
        pricingDatabase.setId(databaseId);
        pricingDatabase.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("CSV import report")
    class CsvImportReportTests {

        @Test
        @DisplayName("Should return detailed import report with duplicates/skips/errors")
        void shouldReturnImportReportWithCounters() {
            when(databaseRepository.findById(databaseId)).thenReturn(Optional.of(pricingDatabase));
            when(rateRepository.existsByDatabaseIdAndCodeAndDeletedFalse(databaseId, "F1")).thenReturn(false);
            when(rateRepository.existsByDatabaseIdAndCodeAndDeletedFalse(databaseId, "F2")).thenReturn(true);

            String csv = """
                    code;name;unit;labor;material;equipment;overhead;total;category;subcategory
                    F1;Rate One;m2;10;20;5;2;37;CAT;SUB
                    F2;Rate Two;m2;10;20;5;2;37;CAT;SUB
                    ;Broken;m2;10;20;5;2;37;CAT;SUB
                    """;
            InputStream stream = new ByteArrayInputStream(csv.getBytes());

            var report = pricingService.importRatesWithReport(databaseId, stream);

            assertThat(report.totalRows()).isEqualTo(3);
            assertThat(report.importedRows()).isEqualTo(1);
            assertThat(report.duplicateRows()).isEqualTo(1);
            assertThat(report.skippedRows()).isEqualTo(1);
            assertThat(report.errorRows()).isEqualTo(0);
            verify(rateRepository, times(1)).saveAll(any());
        }
    }

    @Nested
    @DisplayName("Quarterly indices import")
    class QuarterlyIndicesImportTests {

        @Test
        @DisplayName("Should import only non-duplicate quarterly indices")
        void shouldImportQuarterlyIndicesSkippingDuplicates() {
            ImportQuarterlyPriceIndicesRequest request = new ImportQuarterlyPriceIndicesRequest(
                    "2026-Q1",
                    "minstroy.xlsx",
                    List.of(
                            new ImportQuarterlyPriceIndicesRequest.IndexEntry(
                                    "Москва", "construction", "2026-Q1", new BigDecimal("1.1245")
                            ),
                            new ImportQuarterlyPriceIndicesRequest.IndexEntry(
                                    "Москва", "materials", "2026-Q1", new BigDecimal("1.2211")
                            )
                    )
            );

            when(indexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    "Москва", "СМР", "2026-Q1", "2026-Q1"
            )).thenReturn(false);
            when(indexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    "Москва", "Материалы", "2026-Q1", "2026-Q1"
            )).thenReturn(true);
            when(indexRepository.save(any(PriceIndex.class))).thenAnswer(inv -> inv.getArgument(0));

            QuarterlyIndexImportResponse response = pricingService.importQuarterlyIndices(request);

            assertThat(response.quarter()).isEqualTo("2026-Q1");
            assertThat(response.totalEntries()).isEqualTo(2);
            assertThat(response.importedEntries()).isEqualTo(1);
            assertThat(response.duplicateEntries()).isEqualTo(1);
            assertThat(response.skippedEntries()).isEqualTo(0);
            verify(indexRepository, times(1)).save(any(PriceIndex.class));
        }
    }
}
