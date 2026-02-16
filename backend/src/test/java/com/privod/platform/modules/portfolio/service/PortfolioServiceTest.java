package com.privod.platform.modules.portfolio.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.portfolio.domain.BidPackage;
import com.privod.platform.modules.portfolio.domain.BidStatus;
import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import com.privod.platform.modules.portfolio.domain.Prequalification;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;
import com.privod.platform.modules.portfolio.domain.TenderSubmission;
import com.privod.platform.modules.portfolio.repository.BidPackageRepository;
import com.privod.platform.modules.portfolio.repository.OpportunityRepository;
import com.privod.platform.modules.portfolio.repository.PrequalificationRepository;
import com.privod.platform.modules.portfolio.repository.TenderSubmissionRepository;
import com.privod.platform.modules.portfolio.web.dto.BidPackageResponse;
import com.privod.platform.modules.portfolio.web.dto.ChangeOpportunityStageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateTenderSubmissionRequest;
import com.privod.platform.modules.portfolio.web.dto.OpportunityResponse;
import com.privod.platform.modules.portfolio.web.dto.PortfolioDashboardResponse;
import com.privod.platform.modules.portfolio.web.dto.PrequalificationResponse;
import com.privod.platform.modules.portfolio.web.dto.TenderSubmissionResponse;
import com.privod.platform.modules.portfolio.web.dto.UpdateOpportunityRequest;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private BidPackageRepository bidPackageRepository;

    @Mock
    private PrequalificationRepository prequalificationRepository;

    @Mock
    private TenderSubmissionRepository tenderSubmissionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PortfolioService portfolioService;

    private UUID opportunityId;
    private Opportunity testOpportunity;
    private UUID bidPackageId;
    private BidPackage testBidPackage;
    private UUID prequalificationId;
    private Prequalification testPrequalification;
    private UUID tenderSubmissionId;
    private TenderSubmission testTenderSubmission;

    @BeforeEach
    void setUp() {
        opportunityId = UUID.randomUUID();
        testOpportunity = Opportunity.builder()
                .organizationId(UUID.randomUUID())
                .name("Test Opportunity")
                .description("A test opportunity")
                .clientName("Test Client")
                .clientType(ClientType.COMMERCIAL)
                .stage(OpportunityStage.LEAD)
                .estimatedValue(new BigDecimal("5000000.00"))
                .probability(30)
                .expectedCloseDate(LocalDate.of(2025, 12, 31))
                .ownerId(UUID.randomUUID())
                .source("Website")
                .region("Moscow")
                .build();
        testOpportunity.setId(opportunityId);
        testOpportunity.setCreatedAt(Instant.now());

        bidPackageId = UUID.randomUUID();
        testBidPackage = BidPackage.builder()
                .opportunityId(opportunityId)
                .projectName("Test Bid Project")
                .status(BidStatus.DRAFT)
                .bidNumber("BID-001")
                .clientOrganization("Client Org")
                .bidAmount(new BigDecimal("3000000.00"))
                .estimatedCost(new BigDecimal("2500000.00"))
                .estimatedMargin(new BigDecimal("500000.00"))
                .bondRequired(false)
                .build();
        testBidPackage.setId(bidPackageId);
        testBidPackage.setCreatedAt(Instant.now());

        prequalificationId = UUID.randomUUID();
        testPrequalification = Prequalification.builder()
                .organizationId(UUID.randomUUID())
                .clientName("PQ Client")
                .projectName("PQ Project")
                .status(PrequalificationStatus.DRAFT)
                .submissionDate(LocalDate.of(2025, 6, 1))
                .expiryDate(LocalDate.of(2026, 6, 1))
                .maxContractValue(new BigDecimal("10000000.00"))
                .build();
        testPrequalification.setId(prequalificationId);
        testPrequalification.setCreatedAt(Instant.now());

        tenderSubmissionId = UUID.randomUUID();
        testTenderSubmission = TenderSubmission.builder()
                .bidPackageId(bidPackageId)
                .technicalProposal("Technical details")
                .commercialSummary("Commercial details")
                .totalPrice(new BigDecimal("4000000.00"))
                .discountPercent(new BigDecimal("5.00"))
                .finalPrice(new BigDecimal("3800000.00"))
                .submittedById(UUID.randomUUID())
                .submittedAt(Instant.now())
                .build();
        testTenderSubmission.setId(tenderSubmissionId);
        testTenderSubmission.setCreatedAt(Instant.now());
    }

    // ======================== Opportunity Tests ========================

    @Nested
    @DisplayName("Opportunity CRUD")
    class OpportunityTests {

        @Test
        @DisplayName("Should create opportunity with LEAD stage by default")
        void shouldCreateOpportunity_whenValidInput() {
            CreateOpportunityRequest request = new CreateOpportunityRequest(
                    UUID.randomUUID(), "New Opportunity", "Description",
                    "Client", ClientType.DEVELOPER, new BigDecimal("1000000"),
                    50, LocalDate.of(2025, 12, 31), UUID.randomUUID(),
                    "Referral", "SPB", "Residential", null);

            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> {
                Opportunity o = inv.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            OpportunityResponse response = portfolioService.createOpportunity(request);

            assertThat(response).isNotNull();
            assertThat(response.stage()).isEqualTo(OpportunityStage.LEAD);
            assertThat(response.name()).isEqualTo("New Opportunity");
            verify(auditService).logCreate(eq("Opportunity"), any(UUID.class));
        }

        @Test
        @DisplayName("Should get opportunity by ID")
        void shouldReturnOpportunity_whenFound() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));

            OpportunityResponse response = portfolioService.getOpportunity(opportunityId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Test Opportunity");
            assertThat(response.clientType()).isEqualTo(ClientType.COMMERCIAL);
        }

        @Test
        @DisplayName("Should throw when opportunity not found")
        void shouldThrowException_whenOpportunityNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(opportunityRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> portfolioService.getOpportunity(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when opportunity is deleted")
        void shouldThrowException_whenOpportunityIsDeleted() {
            testOpportunity.softDelete();
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));

            assertThatThrownBy(() -> portfolioService.getOpportunity(opportunityId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should update opportunity fields selectively")
        void shouldUpdateOpportunity_whenValidFields() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateOpportunityRequest request = new UpdateOpportunityRequest(
                    "Updated Name", null, "New Client", ClientType.GOVERNMENT,
                    null, null, null, null, null, null, null, null);

            OpportunityResponse response = portfolioService.updateOpportunity(opportunityId, request);

            assertThat(response.name()).isEqualTo("Updated Name");
            assertThat(response.clientName()).isEqualTo("New Client");
            assertThat(response.clientType()).isEqualTo(ClientType.GOVERNMENT);
            verify(auditService).logUpdate(eq("Opportunity"), eq(opportunityId), eq("multiple"), any(), any());
        }

        @Test
        @DisplayName("Should soft delete opportunity")
        void shouldSoftDeleteOpportunity() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenReturn(testOpportunity);

            portfolioService.deleteOpportunity(opportunityId);

            assertThat(testOpportunity.isDeleted()).isTrue();
            verify(opportunityRepository).save(testOpportunity);
            verify(auditService).logDelete("Opportunity", opportunityId);
        }
    }

    // ======================== Stage Transition Tests ========================

    @Nested
    @DisplayName("Opportunity Stage Transitions")
    class StageTransitionTests {

        @Test
        @DisplayName("Should allow valid transition LEAD -> QUALIFICATION")
        void shouldChangeStage_whenValidTransition() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                    OpportunityStage.QUALIFICATION, null, null);

            OpportunityResponse response = portfolioService.changeStage(opportunityId, request);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("Opportunity", opportunityId, "LEAD", "QUALIFICATION");
        }

        @Test
        @DisplayName("Should reject invalid transition LEAD -> WON")
        void shouldThrowException_whenInvalidTransition() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));

            ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                    OpportunityStage.WON, null, null);

            assertThatThrownBy(() -> portfolioService.changeStage(opportunityId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести");
        }

        @Test
        @DisplayName("Should set lost reason when moving to LOST")
        void shouldSetLostReason_whenTransitionToLost() {
            testOpportunity.setStage(OpportunityStage.QUALIFICATION);
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                    OpportunityStage.LOST, "Too expensive", null);

            portfolioService.changeStage(opportunityId, request);

            ArgumentCaptor<Opportunity> captor = ArgumentCaptor.forClass(Opportunity.class);
            verify(opportunityRepository).save(captor.capture());
            assertThat(captor.getValue().getLostReason()).isEqualTo("Too expensive");
            assertThat(captor.getValue().getActualCloseDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should set wonProjectId and probability=100 when WON")
        void shouldSetWonData_whenTransitionToWon() {
            testOpportunity.setStage(OpportunityStage.NEGOTIATION);
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID wonProjectId = UUID.randomUUID();
            ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                    OpportunityStage.WON, null, wonProjectId);

            portfolioService.changeStage(opportunityId, request);

            ArgumentCaptor<Opportunity> captor = ArgumentCaptor.forClass(Opportunity.class);
            verify(opportunityRepository).save(captor.capture());
            assertThat(captor.getValue().getWonProjectId()).isEqualTo(wonProjectId);
            assertThat(captor.getValue().getProbability()).isEqualTo(100);
            assertThat(captor.getValue().getActualCloseDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should set actualCloseDate when WITHDRAWN")
        void shouldSetCloseDate_whenTransitionToWithdrawn() {
            when(opportunityRepository.findById(opportunityId)).thenReturn(Optional.of(testOpportunity));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                    OpportunityStage.WITHDRAWN, null, null);

            portfolioService.changeStage(opportunityId, request);

            ArgumentCaptor<Opportunity> captor = ArgumentCaptor.forClass(Opportunity.class);
            verify(opportunityRepository).save(captor.capture());
            assertThat(captor.getValue().getActualCloseDate()).isEqualTo(LocalDate.now());
        }
    }

    // ======================== Dashboard Tests ========================

    @Nested
    @DisplayName("Portfolio Dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Should return dashboard stats with win rate")
        void shouldReturnDashboard_withValidStats() {
            UUID orgId = UUID.randomUUID();
            when(opportunityRepository.countTotal(orgId)).thenReturn(10L);
            when(opportunityRepository.countByStageAndOrganizationId(orgId))
                    .thenReturn(List.of(
                            new Object[]{OpportunityStage.LEAD, 5L},
                            new Object[]{OpportunityStage.WON, 3L}));
            when(opportunityRepository.sumPipelineValue(orgId)).thenReturn(new BigDecimal("50000000"));
            when(opportunityRepository.countWon(orgId)).thenReturn(3L);
            when(opportunityRepository.countClosed(orgId)).thenReturn(8L);

            PortfolioDashboardResponse response = portfolioService.getDashboard(orgId);

            assertThat(response.totalOpportunities()).isEqualTo(10L);
            assertThat(response.stageCounts()).containsEntry("LEAD", 5L);
            assertThat(response.stageCounts()).containsEntry("WON", 3L);
            assertThat(response.totalPipelineValue()).isEqualByComparingTo("50000000");
            assertThat(response.wonCount()).isEqualTo(3L);
            assertThat(response.winRate()).isEqualByComparingTo("37.50");
        }

        @Test
        @DisplayName("Should return zero win rate when no closed opportunities")
        void shouldReturnZeroWinRate_whenNoClosedOpportunities() {
            UUID orgId = UUID.randomUUID();
            when(opportunityRepository.countTotal(orgId)).thenReturn(0L);
            when(opportunityRepository.countByStageAndOrganizationId(orgId)).thenReturn(List.of());
            when(opportunityRepository.sumPipelineValue(orgId)).thenReturn(null);
            when(opportunityRepository.countWon(orgId)).thenReturn(0L);
            when(opportunityRepository.countClosed(orgId)).thenReturn(0L);

            PortfolioDashboardResponse response = portfolioService.getDashboard(orgId);

            assertThat(response.winRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.totalPipelineValue()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // ======================== BidPackage Tests ========================

    @Nested
    @DisplayName("BidPackage CRUD")
    class BidPackageTests {

        @Test
        @DisplayName("Should create bid package with DRAFT status")
        void shouldCreateBidPackage_whenValidInput() {
            CreateBidPackageRequest request = new CreateBidPackageRequest(
                    opportunityId, "New Bid", "BID-002", "Client",
                    LocalDateTime.of(2025, 6, 30, 17, 0),
                    new BigDecimal("2000000"), new BigDecimal("1500000"),
                    new BigDecimal("500000"), UUID.randomUUID(), UUID.randomUUID(),
                    true, new BigDecimal("100000"), null, null, "notes");

            when(bidPackageRepository.save(any(BidPackage.class))).thenAnswer(inv -> {
                BidPackage bp = inv.getArgument(0);
                bp.setId(UUID.randomUUID());
                bp.setCreatedAt(Instant.now());
                return bp;
            });

            BidPackageResponse response = portfolioService.createBidPackage(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(BidStatus.DRAFT);
            assertThat(response.projectName()).isEqualTo("New Bid");
            verify(auditService).logCreate(eq("BidPackage"), any(UUID.class));
        }

        @Test
        @DisplayName("Should get bid package by ID")
        void shouldReturnBidPackage_whenFound() {
            when(bidPackageRepository.findById(bidPackageId)).thenReturn(Optional.of(testBidPackage));

            BidPackageResponse response = portfolioService.getBidPackage(bidPackageId);

            assertThat(response).isNotNull();
            assertThat(response.projectName()).isEqualTo("Test Bid Project");
        }

        @Test
        @DisplayName("Should throw when bid package not found")
        void shouldThrowException_whenBidPackageNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(bidPackageRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> portfolioService.getBidPackage(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should soft delete bid package")
        void shouldSoftDeleteBidPackage() {
            when(bidPackageRepository.findById(bidPackageId)).thenReturn(Optional.of(testBidPackage));
            when(bidPackageRepository.save(any(BidPackage.class))).thenReturn(testBidPackage);

            portfolioService.deleteBidPackage(bidPackageId);

            assertThat(testBidPackage.isDeleted()).isTrue();
            verify(auditService).logDelete("BidPackage", bidPackageId);
        }

        @Test
        @DisplayName("Should list bid packages filtered by opportunityId")
        void shouldListBidPackages_filteredByOpportunityId() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<BidPackage> page = new PageImpl<>(List.of(testBidPackage));
            when(bidPackageRepository.findByOpportunityIdAndDeletedFalse(opportunityId, pageable))
                    .thenReturn(page);

            Page<BidPackageResponse> result = portfolioService.listBidPackages(opportunityId, null, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).projectName()).isEqualTo("Test Bid Project");
        }
    }

    // ======================== Prequalification Tests ========================

    @Nested
    @DisplayName("Prequalification CRUD")
    class PrequalificationTests {

        @Test
        @DisplayName("Should create prequalification with DRAFT status")
        void shouldCreatePrequalification_whenValidInput() {
            CreatePrequalificationRequest request = new CreatePrequalificationRequest(
                    UUID.randomUUID(), "PQ Client", "PQ Project",
                    LocalDate.of(2025, 6, 1), LocalDate.of(2026, 6, 1),
                    null, new BigDecimal("8000000"), UUID.randomUUID(), null, "Notes");

            when(prequalificationRepository.save(any(Prequalification.class))).thenAnswer(inv -> {
                Prequalification pq = inv.getArgument(0);
                pq.setId(UUID.randomUUID());
                pq.setCreatedAt(Instant.now());
                return pq;
            });

            PrequalificationResponse response = portfolioService.createPrequalification(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(PrequalificationStatus.DRAFT);
            assertThat(response.clientName()).isEqualTo("PQ Client");
            verify(auditService).logCreate(eq("Prequalification"), any(UUID.class));
        }

        @Test
        @DisplayName("Should get prequalification by ID")
        void shouldReturnPrequalification_whenFound() {
            when(prequalificationRepository.findById(prequalificationId))
                    .thenReturn(Optional.of(testPrequalification));

            PrequalificationResponse response = portfolioService.getPrequalification(prequalificationId);

            assertThat(response).isNotNull();
            assertThat(response.clientName()).isEqualTo("PQ Client");
        }

        @Test
        @DisplayName("Should soft delete prequalification")
        void shouldSoftDeletePrequalification() {
            when(prequalificationRepository.findById(prequalificationId))
                    .thenReturn(Optional.of(testPrequalification));
            when(prequalificationRepository.save(any(Prequalification.class)))
                    .thenReturn(testPrequalification);

            portfolioService.deletePrequalification(prequalificationId);

            assertThat(testPrequalification.isDeleted()).isTrue();
            verify(auditService).logDelete("Prequalification", prequalificationId);
        }
    }

    // ======================== TenderSubmission Tests ========================

    @Nested
    @DisplayName("TenderSubmission CRUD")
    class TenderSubmissionTests {

        @Test
        @DisplayName("Should create tender submission with auto-calculated final price")
        void shouldCreateTenderSubmission_withAutoCalculatedFinalPrice() {
            when(bidPackageRepository.findById(bidPackageId)).thenReturn(Optional.of(testBidPackage));

            CreateTenderSubmissionRequest request = new CreateTenderSubmissionRequest(
                    bidPackageId, "Technical Proposal", "Commercial Summary",
                    new BigDecimal("1000000"), new BigDecimal("10"), null,
                    UUID.randomUUID(), null);

            when(tenderSubmissionRepository.save(any(TenderSubmission.class))).thenAnswer(inv -> {
                TenderSubmission ts = inv.getArgument(0);
                ts.setId(UUID.randomUUID());
                ts.setCreatedAt(Instant.now());
                return ts;
            });

            TenderSubmissionResponse response = portfolioService.createTenderSubmission(request);

            assertThat(response).isNotNull();
            assertThat(response.finalPrice()).isEqualByComparingTo("900000.00");
            verify(auditService).logCreate(eq("TenderSubmission"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use provided final price when explicitly set")
        void shouldCreateTenderSubmission_withExplicitFinalPrice() {
            when(bidPackageRepository.findById(bidPackageId)).thenReturn(Optional.of(testBidPackage));

            CreateTenderSubmissionRequest request = new CreateTenderSubmissionRequest(
                    bidPackageId, "Technical Proposal", "Commercial Summary",
                    new BigDecimal("1000000"), new BigDecimal("10"),
                    new BigDecimal("850000"), UUID.randomUUID(), null);

            when(tenderSubmissionRepository.save(any(TenderSubmission.class))).thenAnswer(inv -> {
                TenderSubmission ts = inv.getArgument(0);
                ts.setId(UUID.randomUUID());
                ts.setCreatedAt(Instant.now());
                return ts;
            });

            TenderSubmissionResponse response = portfolioService.createTenderSubmission(request);

            assertThat(response.finalPrice()).isEqualByComparingTo("850000");
        }

        @Test
        @DisplayName("Should throw when creating tender for non-existent bid package")
        void shouldThrowException_whenBidPackageNotFoundForTender() {
            UUID nonExistentId = UUID.randomUUID();
            when(bidPackageRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            CreateTenderSubmissionRequest request = new CreateTenderSubmissionRequest(
                    nonExistentId, "Technical", "Commercial",
                    new BigDecimal("100000"), null, null, UUID.randomUUID(), null);

            assertThatThrownBy(() -> portfolioService.createTenderSubmission(request))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should soft delete tender submission")
        void shouldSoftDeleteTenderSubmission() {
            when(tenderSubmissionRepository.findById(tenderSubmissionId))
                    .thenReturn(Optional.of(testTenderSubmission));
            when(tenderSubmissionRepository.save(any(TenderSubmission.class)))
                    .thenReturn(testTenderSubmission);

            portfolioService.deleteTenderSubmission(tenderSubmissionId);

            assertThat(testTenderSubmission.isDeleted()).isTrue();
            verify(auditService).logDelete("TenderSubmission", tenderSubmissionId);
        }

        @Test
        @DisplayName("Should get tender submission by ID")
        void shouldReturnTenderSubmission_whenFound() {
            when(tenderSubmissionRepository.findById(tenderSubmissionId))
                    .thenReturn(Optional.of(testTenderSubmission));

            TenderSubmissionResponse response = portfolioService.getTenderSubmission(tenderSubmissionId);

            assertThat(response).isNotNull();
            assertThat(response.bidPackageId()).isEqualTo(bidPackageId);
        }
    }
}
