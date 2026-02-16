package com.privod.platform.modules.accounting;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.domain.DepreciationMethod;
import com.privod.platform.modules.accounting.domain.FinancialJournal;
import com.privod.platform.modules.accounting.domain.FixedAsset;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;
import com.privod.platform.modules.accounting.domain.JournalEntry;
import com.privod.platform.modules.accounting.domain.JournalEntryStatus;
import com.privod.platform.modules.accounting.domain.JournalLine;
import com.privod.platform.modules.accounting.domain.JournalType;
import com.privod.platform.modules.accounting.domain.TaxDeclaration;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.accounting.repository.FinancialJournalRepository;
import com.privod.platform.modules.accounting.repository.FixedAssetRepository;
import com.privod.platform.modules.accounting.repository.JournalEntryRepository;
import com.privod.platform.modules.accounting.repository.JournalLineRepository;
import com.privod.platform.modules.accounting.repository.TaxDeclarationRepository;
import com.privod.platform.modules.accounting.service.CounterpartyService;
import com.privod.platform.modules.accounting.service.FixedAssetService;
import com.privod.platform.modules.accounting.service.JournalService;
import com.privod.platform.modules.accounting.service.TaxDeclarationService;
import com.privod.platform.modules.accounting.web.dto.CounterpartyResponse;
import com.privod.platform.modules.accounting.web.dto.CreateCounterpartyRequest;
import com.privod.platform.modules.accounting.web.dto.CreateFixedAssetRequest;
import com.privod.platform.modules.accounting.web.dto.CreateTaxDeclarationRequest;
import com.privod.platform.modules.accounting.web.dto.FixedAssetResponse;
import com.privod.platform.modules.accounting.web.dto.TaxDeclarationResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JournalAndAssetServiceTest {

    @Mock
    private FinancialJournalRepository journalRepository;

    @Mock
    private JournalEntryRepository entryRepository;

    @Mock
    private JournalLineRepository lineRepository;

    @Mock
    private FixedAssetRepository fixedAssetRepository;

    @Mock
    private CounterpartyRepository counterpartyRepository;

    @Mock
    private TaxDeclarationRepository taxDeclarationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private JournalService journalService;

    @InjectMocks
    private FixedAssetService fixedAssetService;

    @InjectMocks
    private CounterpartyService counterpartyService;

    @InjectMocks
    private TaxDeclarationService taxDeclarationService;

    private UUID journalId;
    private UUID entryId;
    private UUID assetId;

    @BeforeEach
    void setUp() {
        journalId = UUID.randomUUID();
        entryId = UUID.randomUUID();
        assetId = UUID.randomUUID();
    }

    // =========================================================================
    // Journal Tests
    // =========================================================================

    @Nested
    @DisplayName("Financial Journal")
    class JournalTests {

        @Test
        @DisplayName("Should create financial journal")
        void createJournal_Success() {
            when(journalRepository.findByCodeAndDeletedFalse("BANK-01"))
                    .thenReturn(Optional.empty());
            when(journalRepository.save(any(FinancialJournal.class))).thenAnswer(inv -> {
                FinancialJournal j = inv.getArgument(0);
                j.setId(UUID.randomUUID());
                j.setCreatedAt(Instant.now());
                return j;
            });

            FinancialJournal result = journalService.createJournal("BANK-01", "Банковский журнал", JournalType.BANK);

            assertThat(result.getCode()).isEqualTo("BANK-01");
            assertThat(result.getJournalType()).isEqualTo(JournalType.BANK);
            assertThat(result.isActive()).isTrue();
            verify(auditService).logCreate(eq("FinancialJournal"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate journal code")
        void createJournal_DuplicateCode() {
            FinancialJournal existing = FinancialJournal.builder()
                    .code("BANK-01").name("Банк").journalType(JournalType.BANK).build();
            when(journalRepository.findByCodeAndDeletedFalse("BANK-01"))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> journalService.createJournal("BANK-01", "Дубликат", JournalType.BANK))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }

        @Test
        @DisplayName("Should create journal entry with auto-generated number")
        void createEntry_AutoNumber() {
            FinancialJournal journal = FinancialJournal.builder()
                    .code("SALES-01").name("Продажи").journalType(JournalType.SALES).build();
            journal.setId(journalId);

            when(journalRepository.findById(journalId)).thenReturn(Optional.of(journal));
            when(entryRepository.getNextNumberSequence()).thenReturn(42L);
            when(entryRepository.save(any(JournalEntry.class))).thenAnswer(inv -> {
                JournalEntry e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            JournalEntry result = journalService.createEntry(journalId, LocalDate.of(2025, 8, 1));

            assertThat(result.getEntryNumber()).isEqualTo("JE-00042");
            assertThat(result.getStatus()).isEqualTo(JournalEntryStatus.DRAFT);
            verify(auditService).logCreate(eq("JournalEntry"), any(UUID.class));
        }

        @Test
        @DisplayName("Should post balanced journal entry")
        void postEntry_Balanced() {
            JournalEntry entry = JournalEntry.builder()
                    .journalId(journalId)
                    .entryNumber("JE-00001")
                    .entryDate(LocalDate.of(2025, 8, 1))
                    .status(JournalEntryStatus.DRAFT)
                    .build();
            entry.setId(entryId);

            JournalLine line1 = JournalLine.builder()
                    .entryId(entryId).accountId(UUID.randomUUID())
                    .debit(new BigDecimal("100000.00")).credit(BigDecimal.ZERO).build();
            JournalLine line2 = JournalLine.builder()
                    .entryId(entryId).accountId(UUID.randomUUID())
                    .debit(BigDecimal.ZERO).credit(new BigDecimal("100000.00")).build();

            when(entryRepository.findById(entryId)).thenReturn(Optional.of(entry));
            when(lineRepository.findByEntryIdAndDeletedFalseOrderByCreatedAtAsc(entryId))
                    .thenReturn(List.of(line1, line2));
            when(entryRepository.save(any(JournalEntry.class))).thenAnswer(inv -> inv.getArgument(0));

            JournalEntry result = journalService.postEntry(entryId);

            assertThat(result.getStatus()).isEqualTo(JournalEntryStatus.POSTED);
            assertThat(result.getTotalDebit()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(result.getTotalCredit()).isEqualByComparingTo(new BigDecimal("100000.00"));
            verify(auditService).logStatusChange("JournalEntry", entryId, "DRAFT", "POSTED");
        }

        @Test
        @DisplayName("Should reject posting unbalanced journal entry")
        void postEntry_Unbalanced() {
            JournalEntry entry = JournalEntry.builder()
                    .journalId(journalId)
                    .entryNumber("JE-00002")
                    .entryDate(LocalDate.of(2025, 8, 1))
                    .status(JournalEntryStatus.DRAFT)
                    .build();
            entry.setId(entryId);

            JournalLine line1 = JournalLine.builder()
                    .entryId(entryId).accountId(UUID.randomUUID())
                    .debit(new BigDecimal("100000.00")).credit(BigDecimal.ZERO).build();
            JournalLine line2 = JournalLine.builder()
                    .entryId(entryId).accountId(UUID.randomUUID())
                    .debit(BigDecimal.ZERO).credit(new BigDecimal("80000.00")).build();

            when(entryRepository.findById(entryId)).thenReturn(Optional.of(entry));
            when(lineRepository.findByEntryIdAndDeletedFalseOrderByCreatedAtAsc(entryId))
                    .thenReturn(List.of(line1, line2));

            assertThatThrownBy(() -> journalService.postEntry(entryId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не равен кредиту");
        }
    }

    // =========================================================================
    // Fixed Asset Tests
    // =========================================================================

    @Nested
    @DisplayName("Fixed Assets")
    class AssetTests {

        @Test
        @DisplayName("Should create fixed asset with DRAFT status and calculated monthly depreciation")
        void createAsset_DraftWithDepreciation() {
            when(fixedAssetRepository.save(any(FixedAsset.class))).thenAnswer(inv -> {
                FixedAsset a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            CreateFixedAssetRequest request = new CreateFixedAssetRequest(
                    "OS-001", "Экскаватор CAT 320", "INV-2025-001",
                    UUID.randomUUID(), LocalDate.of(2025, 1, 15),
                    new BigDecimal("12000000.00"), 120, DepreciationMethod.LINEAR
            );

            FixedAssetResponse response = fixedAssetService.createAsset(request);

            assertThat(response.status()).isEqualTo(FixedAssetStatus.DRAFT);
            assertThat(response.purchaseAmount()).isEqualByComparingTo(new BigDecimal("12000000.00"));
            assertThat(response.currentValue()).isEqualByComparingTo(new BigDecimal("12000000.00"));
            assertThat(response.monthlyDepreciation()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(response.depreciationMethodDisplayName()).isEqualTo("Линейный");
            verify(auditService).logCreate(eq("FixedAsset"), any(UUID.class));
        }

        @Test
        @DisplayName("Should activate DRAFT asset")
        void activateAsset_FromDraft() {
            FixedAsset asset = FixedAsset.builder()
                    .code("OS-001").name("Экскаватор")
                    .inventoryNumber("INV-001")
                    .purchaseDate(LocalDate.of(2025, 1, 1))
                    .purchaseAmount(new BigDecimal("5000000.00"))
                    .usefulLifeMonths(60)
                    .currentValue(new BigDecimal("5000000.00"))
                    .status(FixedAssetStatus.DRAFT)
                    .build();
            asset.setId(assetId);
            asset.setCreatedAt(Instant.now());

            when(fixedAssetRepository.findById(assetId)).thenReturn(Optional.of(asset));
            when(fixedAssetRepository.save(any(FixedAsset.class))).thenAnswer(inv -> inv.getArgument(0));

            FixedAssetResponse response = fixedAssetService.activateAsset(assetId);

            assertThat(response.status()).isEqualTo(FixedAssetStatus.ACTIVE);
            verify(auditService).logStatusChange("FixedAsset", assetId, "DRAFT", "ACTIVE");
        }

        @Test
        @DisplayName("Should reject disposing DRAFT asset directly")
        void disposeAsset_FromDraftRejected() {
            FixedAsset asset = FixedAsset.builder()
                    .code("OS-002").name("Кран")
                    .inventoryNumber("INV-002")
                    .purchaseDate(LocalDate.of(2025, 1, 1))
                    .purchaseAmount(new BigDecimal("1000000.00"))
                    .usefulLifeMonths(120)
                    .currentValue(new BigDecimal("1000000.00"))
                    .status(FixedAssetStatus.DRAFT)
                    .build();
            asset.setId(assetId);

            when(fixedAssetRepository.findById(assetId)).thenReturn(Optional.of(asset));

            assertThatThrownBy(() -> fixedAssetService.disposeAsset(assetId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно списать ОС");
        }
    }

    // =========================================================================
    // Counterparty Tests
    // =========================================================================

    @Nested
    @DisplayName("Counterparties")
    class CounterpartyTests {

        @Test
        @DisplayName("Should create counterparty with all details")
        void createCounterparty_Success() {
            when(counterpartyRepository.findByInnAndDeletedFalse("7707654321"))
                    .thenReturn(Optional.empty());
            when(counterpartyRepository.save(any(Counterparty.class))).thenAnswer(inv -> {
                Counterparty c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateCounterpartyRequest request = new CreateCounterpartyRequest(
                    "ООО СтройМатериал", "7707654321", "770701001", "1177700123456",
                    "г. Москва, ул. Строителей, д. 5", "г. Москва, ул. Строителей, д. 5",
                    "40702810100000001234", "044525225", "30101810400000000225",
                    true, false
            );

            CounterpartyResponse response = counterpartyService.createCounterparty(request);

            assertThat(response.name()).isEqualTo("ООО СтройМатериал");
            assertThat(response.inn()).isEqualTo("7707654321");
            assertThat(response.kpp()).isEqualTo("770701001");
            assertThat(response.supplier()).isTrue();
            assertThat(response.customer()).isFalse();
            assertThat(response.active()).isTrue();
            verify(auditService).logCreate(eq("Counterparty"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate counterparty by INN")
        void createCounterparty_DuplicateInn() {
            Counterparty existing = Counterparty.builder()
                    .name("Existing").inn("7707654321").build();
            when(counterpartyRepository.findByInnAndDeletedFalse("7707654321"))
                    .thenReturn(Optional.of(existing));

            CreateCounterpartyRequest request = new CreateCounterpartyRequest(
                    "Дубликат", "7707654321", null, null,
                    null, null, null, null, null, true, true
            );

            assertThatThrownBy(() -> counterpartyService.createCounterparty(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    // =========================================================================
    // Tax Declaration Tests
    // =========================================================================

    @Nested
    @DisplayName("Tax Declarations")
    class TaxDeclarationTests {

        @Test
        @DisplayName("Should create tax declaration with DRAFT status")
        void createDeclaration_DraftStatus() {
            when(taxDeclarationRepository.save(any(TaxDeclaration.class))).thenAnswer(inv -> {
                TaxDeclaration d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            UUID periodId = UUID.randomUUID();
            CreateTaxDeclarationRequest request = new CreateTaxDeclarationRequest(
                    DeclarationType.VAT, periodId, new BigDecimal("850000.00"),
                    "НДС за 2 квартал 2025"
            );

            TaxDeclarationResponse response = taxDeclarationService.createDeclaration(request);

            assertThat(response.status()).isEqualTo(DeclarationStatus.DRAFT);
            assertThat(response.declarationType()).isEqualTo(DeclarationType.VAT);
            assertThat(response.declarationTypeDisplayName()).isEqualTo("НДС");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("850000.00"));
            verify(auditService).logCreate(eq("TaxDeclaration"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject accepting non-submitted declaration")
        void acceptDeclaration_NotSubmittedRejected() {
            UUID declId = UUID.randomUUID();
            TaxDeclaration declaration = TaxDeclaration.builder()
                    .declarationType(DeclarationType.PROFIT)
                    .periodId(UUID.randomUUID())
                    .status(DeclarationStatus.DRAFT)
                    .amount(new BigDecimal("1000000.00"))
                    .build();
            declaration.setId(declId);

            when(taxDeclarationRepository.findById(declId)).thenReturn(Optional.of(declaration));

            assertThatThrownBy(() -> taxDeclarationService.acceptDeclaration(declId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно принять декларацию");
        }
    }
}
