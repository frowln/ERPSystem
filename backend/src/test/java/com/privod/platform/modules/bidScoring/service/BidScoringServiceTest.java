package com.privod.platform.modules.bidScoring.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
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
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidCriteriaRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
    private ProjectRepository projectRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private BidScoringService bidScoringService;

    private UUID organizationId;
    private UUID currentUserId;
    private UUID comparisonId;
    private UUID projectId;
    private UUID criteriaId;

    private BidComparison draftComparison;
    private BidCriteria criteria;

    @BeforeEach
    void setUp() {
        organizationId = UUID.randomUUID();
        currentUserId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        comparisonId = UUID.randomUUID();
        criteriaId = UUID.randomUUID();

        authenticate(currentUserId, organizationId);

        draftComparison = BidComparison.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .title("Comparison A")
                .status(ComparisonStatus.DRAFT)
                .createdById(currentUserId)
                .build();
        draftComparison.setId(comparisonId);
        draftComparison.setCreatedAt(Instant.now());

        criteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.PRICE)
                .name("Price")
                .weight(new BigDecimal("40"))
                .maxScore(10)
                .sortOrder(1)
                .build();
        criteria.setId(criteriaId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("createComparison: uses organization and current user from security context")
    void createComparisonUsesTenantAndCurrentUser() {
        CreateBidComparisonRequest request = new CreateBidComparisonRequest(
                projectId,
                "New comparison",
                "Description",
                "RFQ-100",
                "Materials",
                UUID.randomUUID()
        );

        when(projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId))
                .thenReturn(Optional.of(project(projectId, organizationId)));
        when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(invocation -> {
            BidComparison entity = invocation.getArgument(0);
            entity.setId(comparisonId);
            return entity;
        });

        BidComparisonResponse response = bidScoringService.createComparison(request);

        ArgumentCaptor<BidComparison> captor = ArgumentCaptor.forClass(BidComparison.class);
        verify(bidComparisonRepository).save(captor.capture());
        assertThat(captor.getValue().getOrganizationId()).isEqualTo(organizationId);
        assertThat(captor.getValue().getCreatedById()).isEqualTo(currentUserId);
        assertThat(response.status()).isEqualTo(ComparisonStatus.DRAFT);
    }

    @Test
    @DisplayName("createComparison: rejects project outside current organization")
    void createComparisonRejectsForeignProject() {
        CreateBidComparisonRequest request = new CreateBidComparisonRequest(
                projectId,
                "New comparison",
                null,
                null,
                null,
                null
        );
        when(projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bidScoringService.createComparison(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Проект не найден");
        verify(bidComparisonRepository, never()).save(any(BidComparison.class));
    }

    @Test
    @DisplayName("listComparisons: filters by current organization")
    void listComparisonsIsTenantScoped() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<BidComparison> page = new PageImpl<>(List.of(draftComparison));
        when(bidComparisonRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable))
                .thenReturn(page);

        Page<BidComparisonResponse> result = bidScoringService.listComparisons(null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(bidComparisonRepository).findByOrganizationIdAndDeletedFalse(organizationId, pageable);
    }

    @Test
    @DisplayName("updateComparison: rejects winner that has no score rows")
    void updateComparisonRejectsWinnerWithoutScores() {
        UUID unknownVendorId = UUID.randomUUID();
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidScoreRepository.existsByBidComparisonIdAndVendorIdAndDeletedFalse(comparisonId, unknownVendorId))
                .thenReturn(false);

        UpdateBidComparisonRequest request = new UpdateBidComparisonRequest(
                null,
                null,
                null,
                null,
                unknownVendorId,
                null
        );

        assertThatThrownBy(() -> bidScoringService.updateComparison(comparisonId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("победитель отсутствует");
    }

    @Test
    @DisplayName("completeComparison: fails when no vendor scores exist")
    void completeComparisonFailsWithoutScores() {
        draftComparison.setStatus(ComparisonStatus.IN_PROGRESS);
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                .thenReturn(new BigDecimal("100"));
        when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                .thenReturn(List.of(criteria));
        when(bidScoreRepository.findByBidComparisonIdAndDeletedFalse(comparisonId))
                .thenReturn(List.of());

        assertThatThrownBy(() -> bidScoringService.completeComparison(comparisonId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("по всем критериям");
        verify(bidComparisonRepository, never()).save(any(BidComparison.class));
    }

    @Test
    @DisplayName("completeComparison: winner is selected only among fully-scored vendors")
    void completeComparisonUsesOnlyFullyScoredVendors() {
        UUID secondCriteriaId = UUID.randomUUID();
        UUID incompleteVendorId = UUID.randomUUID();
        UUID completeVendorId = UUID.randomUUID();

        BidCriteria secondCriteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.QUALITY)
                .name("Quality")
                .weight(new BigDecimal("60"))
                .maxScore(10)
                .sortOrder(2)
                .build();
        secondCriteria.setId(secondCriteriaId);

        BidScore incompleteVendorScore = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(incompleteVendorId)
                .vendorName("Incomplete Vendor")
                .score(new BigDecimal("9.5"))
                .weightedScore(new BigDecimal("38.0000"))
                .build();
        BidScore completeVendorScore1 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(completeVendorId)
                .vendorName("Complete Vendor")
                .score(new BigDecimal("7"))
                .weightedScore(new BigDecimal("28.0000"))
                .build();
        BidScore completeVendorScore2 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(secondCriteriaId)
                .vendorId(completeVendorId)
                .vendorName("Complete Vendor")
                .score(new BigDecimal("7"))
                .weightedScore(new BigDecimal("42.0000"))
                .build();

        draftComparison.setStatus(ComparisonStatus.IN_PROGRESS);
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId))
                .thenReturn(new BigDecimal("100"));
        when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                .thenReturn(List.of(criteria, secondCriteria));
        when(bidScoreRepository.findByBidComparisonIdAndDeletedFalse(comparisonId))
                .thenReturn(List.of(incompleteVendorScore, completeVendorScore1, completeVendorScore2));
        when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BidComparisonResponse response = bidScoringService.completeComparison(comparisonId);

        assertThat(response.status()).isEqualTo(ComparisonStatus.COMPLETED);
        assertThat(response.winnerVendorId()).isEqualTo(completeVendorId);
    }

    @Test
    @DisplayName("getVendorRanking: returns only vendors with full score matrix")
    void getVendorRankingReturnsOnlyFullyScoredVendors() {
        UUID secondCriteriaId = UUID.randomUUID();
        UUID fullVendorId = UUID.randomUUID();
        UUID partialVendorId = UUID.randomUUID();

        BidCriteria secondCriteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.QUALITY)
                .name("Quality")
                .weight(new BigDecimal("60"))
                .maxScore(10)
                .sortOrder(2)
                .build();
        secondCriteria.setId(secondCriteriaId);

        BidScore fullVendorScore1 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(fullVendorId)
                .vendorName("Full Vendor")
                .score(new BigDecimal("6"))
                .weightedScore(new BigDecimal("24.0000"))
                .build();
        BidScore fullVendorScore2 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(secondCriteriaId)
                .vendorId(fullVendorId)
                .vendorName("Full Vendor")
                .score(new BigDecimal("8"))
                .weightedScore(new BigDecimal("48.0000"))
                .build();
        BidScore partialVendorScore = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(partialVendorId)
                .vendorName("Partial Vendor")
                .score(new BigDecimal("10"))
                .weightedScore(new BigDecimal("40.0000"))
                .build();

        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                .thenReturn(List.of(criteria, secondCriteria));
        when(bidScoreRepository.findByBidComparisonIdAndDeletedFalse(comparisonId))
                .thenReturn(List.of(fullVendorScore1, fullVendorScore2, partialVendorScore));

        assertThat(bidScoringService.getVendorRanking(comparisonId))
                .hasSize(1)
                .first()
                .satisfies(row -> {
                    assertThat(row.vendorId()).isEqualTo(fullVendorId);
                    assertThat(row.totalWeightedScore()).isEqualByComparingTo("72.0000");
                });
    }

    @Test
    @DisplayName("getVendorRanking: recalculates totals from raw score and current criteria")
    void getVendorRankingRecalculatesFromRawScores() {
        UUID secondCriteriaId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();

        BidCriteria secondCriteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.QUALITY)
                .name("Quality")
                .weight(new BigDecimal("60"))
                .maxScore(10)
                .sortOrder(2)
                .build();
        secondCriteria.setId(secondCriteriaId);

        BidScore scoreWithStaleWeightedValue1 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(vendorId)
                .vendorName("Vendor A")
                .score(new BigDecimal("8"))
                .weightedScore(new BigDecimal("1.0000"))
                .build();
        BidScore scoreWithStaleWeightedValue2 = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(secondCriteriaId)
                .vendorId(vendorId)
                .vendorName("Vendor A")
                .score(new BigDecimal("5"))
                .weightedScore(new BigDecimal("1.0000"))
                .build();

        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                .thenReturn(List.of(criteria, secondCriteria));
        when(bidScoreRepository.findByBidComparisonIdAndDeletedFalse(comparisonId))
                .thenReturn(List.of(scoreWithStaleWeightedValue1, scoreWithStaleWeightedValue2));

        assertThat(bidScoringService.getVendorRanking(comparisonId))
                .hasSize(1)
                .first()
                .satisfies(row -> {
                    assertThat(row.vendorId()).isEqualTo(vendorId);
                    assertThat(row.totalWeightedScore()).isEqualByComparingTo("62.0000");
                });
    }

    @Test
    @DisplayName("determineWinner: fails when no vendor has full score matrix")
    void determineWinnerFailsWhenNoFullyScoredVendor() {
        UUID secondCriteriaId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();

        BidCriteria secondCriteria = BidCriteria.builder()
                .bidComparisonId(comparisonId)
                .criteriaType(CriteriaType.QUALITY)
                .name("Quality")
                .weight(new BigDecimal("60"))
                .maxScore(10)
                .sortOrder(2)
                .build();
        secondCriteria.setId(secondCriteriaId);

        BidScore partialVendorScore = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(vendorId)
                .vendorName("Partial Vendor")
                .score(new BigDecimal("9"))
                .weightedScore(new BigDecimal("36.0000"))
                .build();

        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(comparisonId))
                .thenReturn(List.of(criteria, secondCriteria));
        when(bidScoreRepository.findByBidComparisonIdAndDeletedFalse(comparisonId))
                .thenReturn(List.of(partialVendorScore));

        assertThatThrownBy(() -> bidScoringService.determineWinner(comparisonId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("полным набором оценок");
    }

    @Test
    @DisplayName("approveComparison: uses current user when approvedById is not passed")
    void approveComparisonUsesCurrentUserAsApprover() {
        UUID winnerVendorId = UUID.randomUUID();
        draftComparison.setStatus(ComparisonStatus.COMPLETED);
        draftComparison.setWinnerVendorId(winnerVendorId);
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BidComparisonResponse response = bidScoringService.approveComparison(comparisonId, null);

        ArgumentCaptor<BidComparison> captor = ArgumentCaptor.forClass(BidComparison.class);
        verify(bidComparisonRepository).save(captor.capture());
        assertThat(captor.getValue().getApprovedById()).isEqualTo(currentUserId);
        assertThat(captor.getValue().getApprovedAt()).isNotNull();
        assertThat(response.status()).isEqualTo(ComparisonStatus.APPROVED);
    }

    @Test
    @DisplayName("approveComparison: ignores spoofed approvedById and stores current user")
    void approveComparisonIgnoresSpoofedApprover() {
        UUID winnerVendorId = UUID.randomUUID();
        UUID spoofedApproverId = UUID.randomUUID();
        draftComparison.setStatus(ComparisonStatus.COMPLETED);
        draftComparison.setWinnerVendorId(winnerVendorId);
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidComparisonRepository.save(any(BidComparison.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BidComparisonResponse response = bidScoringService.approveComparison(comparisonId, spoofedApproverId);

        ArgumentCaptor<BidComparison> captor = ArgumentCaptor.forClass(BidComparison.class);
        verify(bidComparisonRepository).save(captor.capture());
        assertThat(captor.getValue().getApprovedById()).isEqualTo(currentUserId);
        assertThat(captor.getValue().getApprovedById()).isNotEqualTo(spoofedApproverId);
        assertThat(response.status()).isEqualTo(ComparisonStatus.APPROVED);
    }

    @Test
    @DisplayName("approveComparison: rejects COMPLETED comparison without winner")
    void approveComparisonRequiresWinner() {
        draftComparison.setStatus(ComparisonStatus.COMPLETED);
        draftComparison.setWinnerVendorId(null);
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));

        assertThatThrownBy(() -> bidScoringService.approveComparison(comparisonId, currentUserId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("без выбранного победителя");
    }

    @Test
    @DisplayName("createScore: updates existing active score instead of creating duplicate")
    void createScoreUpsertsExistingRow() {
        UUID vendorId = UUID.randomUUID();
        BidScore existing = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(vendorId)
                .vendorName("Vendor A")
                .score(new BigDecimal("6"))
                .weightedScore(new BigDecimal("24.0000"))
                .build();
        existing.setId(UUID.randomUUID());

        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(criteria));
        when(bidScoreRepository.findByBidComparisonIdAndCriteriaIdAndVendorIdAndDeletedFalse(comparisonId, criteriaId, vendorId))
                .thenReturn(Optional.of(existing));
        when(bidScoreRepository.save(existing)).thenReturn(existing);

        CreateBidScoreRequest request = new CreateBidScoreRequest(
                comparisonId,
                criteriaId,
                vendorId,
                "Vendor A",
                new BigDecimal("8"),
                "Improved proposal",
                currentUserId
        );

        BidScoreResponse response = bidScoringService.createScore(request);

        assertThat(response.score()).isEqualByComparingTo("8");
        assertThat(response.weightedScore()).isEqualByComparingTo("32.0000");
        verify(auditService).logUpdate(eq("BidScore"), eq(existing.getId()), eq("score"), eq("6"), eq("8"));
    }

    @Test
    @DisplayName("updateCriteria: recalculates weighted scores when weight changes")
    void updateCriteriaRecalculatesScores() {
        BidScore score = BidScore.builder()
                .bidComparisonId(comparisonId)
                .criteriaId(criteriaId)
                .vendorId(UUID.randomUUID())
                .score(new BigDecimal("8"))
                .weightedScore(new BigDecimal("32.0000"))
                .build();
        score.setId(UUID.randomUUID());

        when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(criteria));
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));
        when(bidCriteriaRepository.sumWeightByBidComparisonId(comparisonId)).thenReturn(new BigDecimal("90"));
        when(bidCriteriaRepository.save(any(BidCriteria.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bidScoreRepository.findByCriteriaIdAndDeletedFalse(criteriaId)).thenReturn(List.of(score));
        when(bidScoreRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateBidCriteriaRequest request = new UpdateBidCriteriaRequest(
                null,
                null,
                null,
                new BigDecimal("50"),
                null,
                null
        );

        BidCriteriaResponse response = bidScoringService.updateCriteria(criteriaId, request);

        assertThat(response.weight()).isEqualByComparingTo("50");
        assertThat(score.getWeightedScore()).isEqualByComparingTo("40.0000");
        verify(bidScoreRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("updateCriteria: rejects edit when comparison is completed")
    void updateCriteriaRejectsWhenComparisonCompleted() {
        draftComparison.setStatus(ComparisonStatus.COMPLETED);
        when(bidCriteriaRepository.findById(criteriaId)).thenReturn(Optional.of(criteria));
        when(bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(comparisonId, organizationId))
                .thenReturn(Optional.of(draftComparison));

        UpdateBidCriteriaRequest request = new UpdateBidCriteriaRequest(
                null,
                "Updated",
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> bidScoringService.updateCriteria(criteriaId, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("недоступно");
    }

    private Project project(UUID id, UUID orgId) {
        Project project = Project.builder()
                .code("PRJ-1")
                .name("Project")
                .organizationId(orgId)
                .build();
        project.setId(id);
        return project;
    }

    private void authenticate(UUID userId, UUID orgId) {
        Role role = Role.builder()
                .code("PROJECT_MANAGER")
                .name("Project Manager")
                .systemRole(true)
                .build();

        User user = User.builder()
                .email("pm@example.com")
                .passwordHash("secret")
                .firstName("Test")
                .lastName("Manager")
                .enabled(true)
                .organizationId(orgId)
                .roles(Set.of(role))
                .build();
        user.setId(userId);

        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }
}
