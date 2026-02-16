package com.privod.platform.modules.bidScoring.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.BidCriteria;
import com.privod.platform.modules.bidScoring.domain.BidScore;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import com.privod.platform.modules.bidScoring.domain.CriteriaType;
import com.privod.platform.modules.bidScoring.repository.BidComparisonRepository;
import com.privod.platform.modules.bidScoring.repository.BidCriteriaRepository;
import com.privod.platform.modules.bidScoring.repository.BidScoreRepository;
import com.privod.platform.modules.bidScoring.web.dto.BidComparisonResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidCriteriaResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidScoreResponse;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.VendorTotalScoreResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
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
class BidScoringServiceTest {

    @Mock
    private BidComparisonRepository bidComparisonRepository;

    @Mock
    private BidCriteriaRepository bidCriteriaRepository;

    @Mock
    private BidScoreRepository bidScoreRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BidScoringService bidScoringService;

    private UUID comparisonId;
    private BidComparison testComparison;
    private UUID criteriaId;
    private BidCriteria testCriteria;

    @BeforeEach
    void setUp() {
        comparisonId = UUID.randomUUID();
        testComparison = BidComparison.builder()
                .projectId(UUID.randomUUID())
                .title("Test Comparison")
                .description("Comparison description")
                .status(ComparisonStatus.DRAFT)
                .rfqNumber("RFQ-001")
                .category("Materials")
                .createdById(UUID.randomUUID())
                .build();
        testComparison.setId(comparisonId);
        testComparison.setCreatedAt(Instant.now());

        criteriaId = UUID.randomUUID();
        testCriteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.PRICE)
                .name("Price Criteria")
                .weight(new BigDecimal("40"))
                .maxScore(10)
                .sortOrder(1)
                .build();
        testCriteria.setId(criteriaId);
        testCriteria.setCreatedAt(Instant.now());
    }

    // ======================== BidComparison Tests ========================

    @Nested
    @DisplayName("BidComparison CRUD")
    class ComparisonTests {

        @Test
        @DisplayName("Should create comparison with DRAFT status")
        void shouldCreateComparison_whenValidInput() {
            CreateBidComparisonRequest request = new CreateBidComparisonRequest(
                    UUID.randomUUID(), "New Comparison", "Description",
                    "RFQ-002", "Equipment", UUID.randomUUID());

            when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(inv -> {
                BidComparison bc = inv.getArgument(0);
                bc.setId(UUID.randomUUID());
                bc.setCreatedAt(Instant.now());
                return bc;
            });

            BidComparisonResponse response = bidScoringService.createComparison(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(ComparisonStatus.DRAFT);
            assertThat(response.title()).isEqualTo("New Comparison");
            verify(auditService).logCreate(eq("BidComparison"), any(UUID.class));
        }

        @Test
        @DisplayName("Should get comparison by ID")
        void shouldReturnComparison_whenFound() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            BidComparisonResponse response = bidScoringService.getComparison(comparisonId);

            assertThat(response).isNotNull();
            assertThat(response.title()).isEqualTo("Test Comparison");
            assertThat(response.rfqNumber()).isEqualTo("RFQ-001");
        }

        @Test
        @DisplayName("Should throw when comparison not found")
        void shouldThrowException_whenComparisonNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(bidComparisonRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bidScoringService.getComparison(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should update comparison fields")
        void shouldUpdateComparison_whenValidFields() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBidComparisonRequest request = new UpdateBidComparisonRequest(
                    "Updated Title", "New description", "RFQ-003",
                    "New Category", null, null);

            BidComparisonResponse response = bidScoringService.updateComparison(comparisonId, request);

            assertThat(response.title()).isEqualTo("Updated Title");
            verify(auditService).logUpdate(eq("BidComparison"), eq(comparisonId), eq("multiple"), any(), any());
        }

        @Test
        @DisplayName("Should soft delete comparison")
        void shouldSoftDeleteComparison() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidComparisonRepository.save(any(BidComparison.class))).thenReturn(testComparison);

            bidScoringService.deleteComparison(comparisonId);

            assertThat(testComparison.isDeleted()).isTrue();
            verify(auditService).logDelete("BidComparison", comparisonId);
        }

        @Test
        @DisplayName("Should list comparisons filtered by projectId")
        void shouldListComparisons_filteredByProjectId() {
            UUID projectId = testComparison.getProjectId();
            Pageable pageable = PageRequest.of(0, 20);
            Page<BidComparison> page = new PageImpl<>(List.of(testComparison));
            when(bidComparisonRepository.findByProjectIdAndDeletedFalse(projectId, pageable))
                    .thenReturn(page);

            Page<BidComparisonResponse> result = bidScoringService.listComparisons(projectId, null, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    // ======================== State Transition Tests ========================

    @Nested
    @DisplayName("BidComparison State Transitions")
    class StateTransitionTests {

        @Test
        @DisplayName("Should start comparison from DRAFT to IN_PROGRESS")
        void shouldStartComparison_whenDraft() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(inv -> inv.getArgument(0));

            BidComparisonResponse response = bidScoringService.startComparison(comparisonId);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("BidComparison", comparisonId, "DRAFT", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should reject start when not in DRAFT status")
        void shouldThrowException_whenStartNotDraft() {
            testComparison.setStatus(ComparisonStatus.IN_PROGRESS);
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            assertThatThrownBy(() -> bidScoringService.startComparison(comparisonId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }

        @Test
        @DisplayName("Should complete comparison when IN_PROGRESS and weights sum to 100")
        void shouldCompleteComparison_whenValid() {
            testComparison.setStatus(ComparisonStatus.IN_PROGRESS);
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                    .thenReturn(new BigDecimal("100"));

            UUID vendorId = UUID.randomUUID();
            when(bidScoreRepository.getVendorTotalScores(comparisonId))
                    .thenReturn(List.of(new Object[]{vendorId, "Vendor A", new BigDecimal("85.50")}));
            when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(inv -> inv.getArgument(0));

            BidComparisonResponse response = bidScoringService.completeComparison(comparisonId);

            assertThat(response).isNotNull();
            ArgumentCaptor<BidComparison> captor = ArgumentCaptor.forClass(BidComparison.class);
            verify(bidComparisonRepository).save(captor.capture());
            assertThat(captor.getValue().getWinnerVendorId()).isEqualTo(vendorId);
            assertThat(captor.getValue().getStatus()).isEqualTo(ComparisonStatus.COMPLETED);
        }

        @Test
        @DisplayName("Should reject complete when weights do not sum to 100")
        void shouldThrowException_whenWeightsNotSum100() {
            testComparison.setStatus(ComparisonStatus.IN_PROGRESS);
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                    .thenReturn(new BigDecimal("80"));

            assertThatThrownBy(() -> bidScoringService.completeComparison(comparisonId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("100%");
        }

        @Test
        @DisplayName("Should reject complete when not IN_PROGRESS")
        void shouldThrowException_whenCompleteNotInProgress() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            assertThatThrownBy(() -> bidScoringService.completeComparison(comparisonId))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("Should approve comparison when COMPLETED")
        void shouldApproveComparison_whenCompleted() {
            testComparison.setStatus(ComparisonStatus.COMPLETED);
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID approvedById = UUID.randomUUID();
            BidComparisonResponse response = bidScoringService.approveComparison(comparisonId, approvedById);

            assertThat(response).isNotNull();
            ArgumentCaptor<BidComparison> captor = ArgumentCaptor.forClass(BidComparison.class);
            verify(bidComparisonRepository).save(captor.capture());
            assertThat(captor.getValue().getApprovedById()).isEqualTo(approvedById);
            assertThat(captor.getValue().getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject approve when not COMPLETED")
        void shouldThrowException_whenApproveNotCompleted() {
            testComparison.setStatus(ComparisonStatus.IN_PROGRESS);
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            assertThatThrownBy(() -> bidScoringService.approveComparison(comparisonId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("завершённое");
        }
    }

    // ======================== BidCriteria Tests ========================

    @Nested
    @DisplayName("BidCriteria CRUD")
    class CriteriaTests {

        @Test
        @DisplayName("Should create criteria when weight within bounds")
        void shouldCreateCriteria_whenWeightValid() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                    .thenReturn(new BigDecimal("50"));

            CreateBidCriteriaRequest request = new CreateBidCriteriaRequest(
                    comparisonId, CriteriaType.QUALITY, "Quality Criteria",
                    "Description", new BigDecimal("30"), 10, 2);

            when(bidCriteriaRepository.save(any(BidCriteria.class))).thenAnswer(inv -> {
                BidCriteria c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            BidCriteriaResponse response = bidScoringService.createCriteria(request);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Quality Criteria");
            verify(auditService).logCreate(eq("BidCriteria"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject criteria when weight would exceed 100%")
        void shouldThrowException_whenWeightExceeds100() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                    .thenReturn(new BigDecimal("80"));

            CreateBidCriteriaRequest request = new CreateBidCriteriaRequest(
                    comparisonId, CriteriaType.PRICE, "Price", null,
                    new BigDecimal("25"), 10, 1);

            assertThatThrownBy(() -> bidScoringService.createCriteria(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("100%");
        }

        @Test
        @DisplayName("Should soft delete criteria")
        void shouldSoftDeleteCriteria() {
            when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(testCriteria));
            when(bidCriteriaRepository.save(any(BidCriteria.class))).thenReturn(testCriteria);

            bidScoringService.deleteCriteria(criteriaId);

            assertThat(testCriteria.isDeleted()).isTrue();
            verify(auditService).logDelete("BidCriteria", criteriaId);
        }

        @Test
        @DisplayName("Should list criteria for comparison ordered by sortOrder")
        void shouldListCriteria_forComparison() {
            when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                    .thenReturn(List.of(testCriteria));

            List<BidCriteriaResponse> result = bidScoringService.listCriteria(comparisonId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Price Criteria");
        }
    }

    // ======================== BidScore Tests ========================

    @Nested
    @DisplayName("BidScore CRUD")
    class ScoreTests {

        @Test
        @DisplayName("Should create score with calculated weighted score")
        void shouldCreateScore_withWeightedScore() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(testCriteria));

            CreateBidScoreRequest request = new CreateBidScoreRequest(
                    comparisonId, criteriaId, UUID.randomUUID(), "Vendor A",
                    new BigDecimal("8"), "Good price", UUID.randomUUID());

            when(bidScoreRepository.save(any(BidScore.class))).thenAnswer(inv -> {
                BidScore s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            BidScoreResponse response = bidScoringService.createScore(request);

            assertThat(response).isNotNull();
            // weightedScore = 8 * 40 / 10 = 32.0000
            assertThat(response.weightedScore()).isEqualByComparingTo("32.0000");
            verify(auditService).logCreate(eq("BidScore"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject score exceeding maxScore")
        void shouldThrowException_whenScoreExceedsMax() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(testCriteria));

            CreateBidScoreRequest request = new CreateBidScoreRequest(
                    comparisonId, criteriaId, UUID.randomUUID(), "Vendor A",
                    new BigDecimal("12"), null, null);

            assertThatThrownBy(() -> bidScoringService.createScore(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("максимально допустимую");
        }

        @Test
        @DisplayName("Should reject score when criteria does not belong to comparison")
        void shouldThrowException_whenCriteriaNotBelongsToComparison() {
            UUID otherComparisonId = UUID.randomUUID();
            BidComparison otherComparison = BidComparison.builder()
                    .projectId(UUID.randomUUID())
                    .title("Other")
                    .status(ComparisonStatus.DRAFT)
                    .build();
            otherComparison.setId(otherComparisonId);
            otherComparison.setCreatedAt(Instant.now());

            when(bidComparisonRepository.findById(otherComparisonId))
                    .thenReturn(Optional.of(otherComparison));
            when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(testCriteria));

            CreateBidScoreRequest request = new CreateBidScoreRequest(
                    otherComparisonId, criteriaId, UUID.randomUUID(), "Vendor",
                    new BigDecimal("5"), null, null);

            assertThatThrownBy(() -> bidScoringService.createScore(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("не принадлежит");
        }

        @Test
        @DisplayName("Should soft delete score")
        void shouldSoftDeleteScore() {
            UUID scoreId = UUID.randomUUID();
            BidScore testScore = BidScore.builder()
                    .bidComparisonId(comparisonId)
                    .criteriaId(criteriaId)
                    .vendorId(UUID.randomUUID())
                    .score(new BigDecimal("8"))
                    .weightedScore(new BigDecimal("32"))
                    .build();
            testScore.setId(scoreId);

            when(bidScoreRepository.findById(scoreId)).thenReturn(Optional.of(testScore));
            when(bidScoreRepository.save(any(BidScore.class))).thenReturn(testScore);

            bidScoringService.deleteScore(scoreId);

            assertThat(testScore.isDeleted()).isTrue();
            verify(auditService).logDelete("BidScore", scoreId);
        }
    }

    // ======================== Ranking & Winner Tests ========================

    @Nested
    @DisplayName("Vendor Ranking and Winner")
    class RankingTests {

        @Test
        @DisplayName("Should return vendor ranking ordered by total weighted score")
        void shouldReturnVendorRanking() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            UUID vendor1 = UUID.randomUUID();
            UUID vendor2 = UUID.randomUUID();
            when(bidScoreRepository.getVendorTotalScores(comparisonId))
                    .thenReturn(List.of(
                            new Object[]{vendor1, "Vendor A", new BigDecimal("85.00")},
                            new Object[]{vendor2, "Vendor B", new BigDecimal("72.50")}));

            List<VendorTotalScoreResponse> ranking = bidScoringService.getVendorRanking(comparisonId);

            assertThat(ranking).hasSize(2);
            assertThat(ranking.get(0).vendorName()).isEqualTo("Vendor A");
            assertThat(ranking.get(0).totalWeightedScore()).isEqualByComparingTo("85.00");
        }

        @Test
        @DisplayName("Should determine winner as first ranked vendor")
        void shouldDetermineWinner() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));

            UUID winnerId = UUID.randomUUID();
            when(bidScoreRepository.getVendorTotalScores(comparisonId))
                    .thenReturn(List.of(
                            new Object[]{winnerId, "Winner Vendor", new BigDecimal("92.00")}));

            VendorTotalScoreResponse winner = bidScoringService.determineWinner(comparisonId);

            assertThat(winner.vendorId()).isEqualTo(winnerId);
            assertThat(winner.vendorName()).isEqualTo("Winner Vendor");
        }

        @Test
        @DisplayName("Should throw when no scores for winner determination")
        void shouldThrowException_whenNoScoresForWinner() {
            when(bidComparisonRepository.findById(comparisonId)).thenReturn(Optional.of(testComparison));
            when(bidScoreRepository.getVendorTotalScores(comparisonId)).thenReturn(List.of());

            assertThatThrownBy(() -> bidScoringService.determineWinner(comparisonId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Нет оценок");
        }
    }
}
