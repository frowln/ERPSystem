package com.privod.platform.modules.russianDoc;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.Upd;
import com.privod.platform.modules.russianDoc.repository.ActRepository;
import com.privod.platform.modules.russianDoc.repository.InventoryActRepository;
import com.privod.platform.modules.russianDoc.repository.PowerOfAttorneyRepository;
import com.privod.platform.modules.russianDoc.repository.SchetFakturaRepository;
import com.privod.platform.modules.russianDoc.repository.Torg12Repository;
import com.privod.platform.modules.russianDoc.repository.UpdRepository;
import com.privod.platform.modules.russianDoc.repository.WaybillRepository;
import com.privod.platform.modules.russianDoc.repository.WriteOffActRepository;
import com.privod.platform.modules.russianDoc.service.RussianDocService;
import com.privod.platform.modules.russianDoc.web.dto.ChangeRussianDocStatusRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateUpdRequest;
import com.privod.platform.modules.russianDoc.web.dto.UpdResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class RussianDocServiceTest {

    @Mock
    private UpdRepository updRepository;
    @Mock
    private Torg12Repository torg12Repository;
    @Mock
    private SchetFakturaRepository schetFakturaRepository;
    @Mock
    private ActRepository actRepository;
    @Mock
    private PowerOfAttorneyRepository poaRepository;
    @Mock
    private WaybillRepository waybillRepository;
    @Mock
    private InventoryActRepository inventoryActRepository;
    @Mock
    private WriteOffActRepository writeOffActRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private RussianDocService service;

    private UUID updId;
    private UUID projectId;
    private Upd testUpd;

    @BeforeEach
    void setUp() {
        updId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testUpd = Upd.builder()
                .number("УПД-001")
                .date(LocalDate.of(2025, 1, 15))
                .sellerId(UUID.randomUUID())
                .buyerId(UUID.randomUUID())
                .items("[{\"name\":\"Цемент М500\",\"quantity\":100,\"price\":500}]")
                .totalAmount(new BigDecimal("50000.00"))
                .vatAmount(new BigDecimal("10000.00"))
                .status(RussianDocStatus.DRAFT)
                .projectId(projectId)
                .build();
        testUpd.setId(updId);
        testUpd.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create UPD")
    class CreateUpdTests {

        @Test
        @DisplayName("Should create UPD with DRAFT status")
        void createUpd_SetsDefaultDraftStatus() {
            CreateUpdRequest request = new CreateUpdRequest(
                    "УПД-002", LocalDate.of(2025, 2, 1),
                    UUID.randomUUID(), UUID.randomUUID(),
                    "[{\"name\":\"Арматура\",\"quantity\":50}]",
                    new BigDecimal("75000.00"), new BigDecimal("15000.00"),
                    null, projectId);

            when(updRepository.save(any(Upd.class))).thenAnswer(invocation -> {
                Upd u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                u.setCreatedAt(Instant.now());
                return u;
            });

            UpdResponse response = service.createUpd(request);

            assertThat(response.status()).isEqualTo(RussianDocStatus.DRAFT);
            assertThat(response.number()).isEqualTo("УПД-002");
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("75000.00"));
            verify(auditService).logCreate(eq("Upd"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create UPD with default zero amounts when not provided")
        void createUpd_DefaultZeroAmounts() {
            CreateUpdRequest request = new CreateUpdRequest(
                    "УПД-003", LocalDate.now(),
                    UUID.randomUUID(), UUID.randomUUID(),
                    null, null, null, null, null);

            when(updRepository.save(any(Upd.class))).thenAnswer(invocation -> {
                Upd u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                u.setCreatedAt(Instant.now());
                return u;
            });

            UpdResponse response = service.createUpd(request);

            assertThat(response.totalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.vatAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.items()).isEqualTo("[]");
        }
    }

    @Nested
    @DisplayName("Get UPD")
    class GetUpdTests {

        @Test
        @DisplayName("Should return UPD by ID")
        void getUpd_ReturnsExistingUpd() {
            when(updRepository.findById(updId)).thenReturn(Optional.of(testUpd));

            UpdResponse response = service.getUpd(updId);

            assertThat(response.id()).isEqualTo(updId);
            assertThat(response.number()).isEqualTo("УПД-001");
            assertThat(response.statusDisplayName()).isEqualTo("Черновик");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for non-existing UPD")
        void getUpd_ThrowsForNonExisting() {
            UUID nonExistingId = UUID.randomUUID();
            when(updRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getUpd(nonExistingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("УПД не найден");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for deleted UPD")
        void getUpd_ThrowsForDeleted() {
            testUpd.setDeleted(true);
            when(updRepository.findById(updId)).thenReturn(Optional.of(testUpd));

            assertThatThrownBy(() -> service.getUpd(updId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Change UPD Status")
    class ChangeUpdStatusTests {

        @Test
        @DisplayName("Should allow valid status transition DRAFT -> CONFIRMED")
        void changeStatus_ValidTransition() {
            when(updRepository.findById(updId)).thenReturn(Optional.of(testUpd));
            when(updRepository.save(any(Upd.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeRussianDocStatusRequest request = new ChangeRussianDocStatusRequest(RussianDocStatus.CONFIRMED);
            UpdResponse response = service.changeUpdStatus(updId, request);

            assertThat(response.status()).isEqualTo(RussianDocStatus.CONFIRMED);
            verify(auditService).logStatusChange("Upd", updId, "DRAFT", "CONFIRMED");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> POSTED")
        void changeStatus_InvalidTransition() {
            when(updRepository.findById(updId)).thenReturn(Optional.of(testUpd));

            ChangeRussianDocStatusRequest request = new ChangeRussianDocStatusRequest(RussianDocStatus.POSTED);

            assertThatThrownBy(() -> service.changeUpdStatus(updId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести УПД");
        }
    }

    @Nested
    @DisplayName("List UPD")
    class ListUpdTests {

        @Test
        @DisplayName("Should list UPD with pagination")
        void listUpd_ReturnsPaginatedResults() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Upd> page = new PageImpl<>(List.of(testUpd), pageable, 1);

            when(updRepository.findByDeletedFalse(pageable)).thenReturn(page);

            Page<UpdResponse> result = service.listUpd(null, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).number()).isEqualTo("УПД-001");
        }

        @Test
        @DisplayName("Should filter UPD by project ID")
        void listUpd_FiltersByProject() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Upd> page = new PageImpl<>(List.of(testUpd), pageable, 1);

            when(updRepository.findByProjectIdAndDeletedFalse(projectId, pageable)).thenReturn(page);

            Page<UpdResponse> result = service.listUpd(projectId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
