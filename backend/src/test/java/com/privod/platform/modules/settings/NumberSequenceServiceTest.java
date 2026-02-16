package com.privod.platform.modules.settings;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.NumberSequence;
import com.privod.platform.modules.settings.domain.ResetPeriod;
import com.privod.platform.modules.settings.repository.NumberSequenceRepository;
import com.privod.platform.modules.settings.service.NumberSequenceService;
import com.privod.platform.modules.settings.web.dto.NumberSequenceResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NumberSequenceServiceTest {

    @Mock
    private NumberSequenceRepository numberSequenceRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private NumberSequenceService numberSequenceService;

    private NumberSequence projectSequence;
    private NumberSequence contractSequence;
    private UUID seqId;

    @BeforeEach
    void setUp() {
        seqId = UUID.randomUUID();

        projectSequence = NumberSequence.builder()
                .code("PRJ")
                .name("Проекты")
                .prefix("PRJ-")
                .suffix(null)
                .nextNumber(42L)
                .step(1)
                .padding(5)
                .resetPeriod(ResetPeriod.NEVER)
                .build();
        projectSequence.setId(seqId);
        projectSequence.setCreatedAt(Instant.now());

        contractSequence = NumberSequence.builder()
                .code("CTR")
                .name("Договоры")
                .prefix("CTR-")
                .suffix(null)
                .nextNumber(15L)
                .step(1)
                .padding(5)
                .resetPeriod(ResetPeriod.YEARLY)
                .lastResetDate(LocalDate.of(LocalDate.now().getYear(), 1, 1))
                .build();
        contractSequence.setId(UUID.randomUUID());
        contractSequence.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Get Next Number")
    class GetNextNumberTests {

        @Test
        @DisplayName("Should generate formatted next number and increment counter")
        void getNextNumber_FormatsAndIncrements() {
            when(numberSequenceRepository.findByCodeForUpdate("PRJ"))
                    .thenReturn(Optional.of(projectSequence));
            when(numberSequenceRepository.save(any(NumberSequence.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            String result = numberSequenceService.getNextNumber("PRJ");

            assertThat(result).isEqualTo("PRJ-00042");
            assertThat(projectSequence.getNextNumber()).isEqualTo(43L);
            verify(numberSequenceRepository).save(projectSequence);
        }

        @Test
        @DisplayName("Should reset yearly sequence when year changes")
        void getNextNumber_ResetsYearly() {
            contractSequence.setLastResetDate(LocalDate.of(LocalDate.now().getYear() - 1, 6, 15));
            contractSequence.setNextNumber(150L);
            when(numberSequenceRepository.findByCodeForUpdate("CTR"))
                    .thenReturn(Optional.of(contractSequence));
            when(numberSequenceRepository.save(any(NumberSequence.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            String result = numberSequenceService.getNextNumber("CTR");

            // After reset, nextNumber should be 1, so formatted = CTR-00001,
            // then incremented to 2
            assertThat(result).isEqualTo("CTR-00001");
            assertThat(contractSequence.getNextNumber()).isEqualTo(2L);
            assertThat(contractSequence.getLastResetDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should NOT reset yearly sequence within same year")
        void getNextNumber_NoResetSameYear() {
            contractSequence.setLastResetDate(LocalDate.now().withDayOfMonth(1));
            contractSequence.setNextNumber(15L);
            when(numberSequenceRepository.findByCodeForUpdate("CTR"))
                    .thenReturn(Optional.of(contractSequence));
            when(numberSequenceRepository.save(any(NumberSequence.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            String result = numberSequenceService.getNextNumber("CTR");

            assertThat(result).isEqualTo("CTR-00015");
            assertThat(contractSequence.getNextNumber()).isEqualTo(16L);
        }

        @Test
        @DisplayName("Should throw when sequence code not found")
        void getNextNumber_NotFound() {
            when(numberSequenceRepository.findByCodeForUpdate("INVALID"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> numberSequenceService.getNextNumber("INVALID"))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Нумератор не найден");
        }

        @Test
        @DisplayName("Should reset monthly sequence when month changes")
        void getNextNumber_ResetsMonthly() {
            NumberSequence monthlySeq = NumberSequence.builder()
                    .code("MOV")
                    .name("Перемещения")
                    .prefix("MOV-")
                    .nextNumber(99L)
                    .step(1)
                    .padding(6)
                    .resetPeriod(ResetPeriod.MONTHLY)
                    .lastResetDate(LocalDate.now().minusMonths(1))
                    .build();
            monthlySeq.setId(UUID.randomUUID());
            monthlySeq.setCreatedAt(Instant.now());

            when(numberSequenceRepository.findByCodeForUpdate("MOV"))
                    .thenReturn(Optional.of(monthlySeq));
            when(numberSequenceRepository.save(any(NumberSequence.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            String result = numberSequenceService.getNextNumber("MOV");

            assertThat(result).isEqualTo("MOV-000001");
            assertThat(monthlySeq.getNextNumber()).isEqualTo(2L);
            assertThat(monthlySeq.getLastResetDate()).isEqualTo(LocalDate.now());
        }
    }

    @Nested
    @DisplayName("List Sequences")
    class ListSequencesTests {

        @Test
        @DisplayName("Should list all sequences with preview")
        void listAll_ReturnsWithPreview() {
            when(numberSequenceRepository.findByDeletedFalseOrderByCodeAsc())
                    .thenReturn(List.of(projectSequence, contractSequence));

            List<NumberSequenceResponse> result = numberSequenceService.listAll();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).code()).isEqualTo("PRJ");
            assertThat(result.get(0).preview()).isEqualTo("PRJ-00042");
            assertThat(result.get(1).preview()).isEqualTo("CTR-00015");
        }
    }
}
