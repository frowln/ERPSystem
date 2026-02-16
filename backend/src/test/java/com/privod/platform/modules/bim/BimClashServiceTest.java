package com.privod.platform.modules.bim;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.BimClash;
import com.privod.platform.modules.bim.domain.ClashSeverity;
import com.privod.platform.modules.bim.domain.ClashStatus;
import com.privod.platform.modules.bim.domain.ClashType;
import com.privod.platform.modules.bim.repository.BimClashRepository;
import com.privod.platform.modules.bim.service.BimClashService;
import com.privod.platform.modules.bim.web.dto.BimClashResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimClashRequest;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BimClashServiceTest {

    @Mock
    private BimClashRepository bimClashRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BimClashService bimClashService;

    private UUID clashId;
    private UUID modelAId;
    private UUID modelBId;
    private BimClash testClash;

    @BeforeEach
    void setUp() {
        clashId = UUID.randomUUID();
        modelAId = UUID.randomUUID();
        modelBId = UUID.randomUUID();

        testClash = BimClash.builder()
                .modelAId(modelAId)
                .modelBId(modelBId)
                .elementAId("wall-001")
                .elementBId("pipe-042")
                .clashType(ClashType.HARD)
                .severity(ClashSeverity.HIGH)
                .status(ClashStatus.NEW)
                .description("Пересечение стены и трубопровода")
                .coordinates(Map.of("x", 10.5, "y", 20.3, "z", 5.0))
                .build();
        testClash.setId(clashId);
        testClash.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание коллизии")
    class CreateTests {

        @Test
        @DisplayName("Должна создать коллизию со статусом NEW")
        void createClash_SetsDefaults() {
            CreateBimClashRequest request = new CreateBimClashRequest(
                    modelAId, modelBId,
                    "beam-001", "duct-015",
                    ClashType.SOFT, ClashSeverity.MEDIUM,
                    "Недостаточный зазор между балкой и воздуховодом",
                    Map.of("x", 15.0, "y", 8.0, "z", 3.5)
            );

            when(bimClashRepository.save(any(BimClash.class))).thenAnswer(inv -> {
                BimClash c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            BimClashResponse response = bimClashService.createClash(request);

            assertThat(response.status()).isEqualTo(ClashStatus.NEW);
            assertThat(response.clashType()).isEqualTo(ClashType.SOFT);
            assertThat(response.severity()).isEqualTo(ClashSeverity.MEDIUM);
            assertThat(response.clashTypeDisplayName()).isEqualTo("Мягкая коллизия");
            assertThat(response.severityDisplayName()).isEqualTo("Средняя");
            verify(auditService).logCreate(eq("BimClash"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Решение коллизии")
    class ResolveTests {

        @Test
        @DisplayName("Должна решить коллизию из статуса NEW")
        void resolveClash_FromNew() {
            UUID resolverId = UUID.randomUUID();
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));
            when(bimClashRepository.save(any(BimClash.class))).thenAnswer(inv -> inv.getArgument(0));

            BimClashResponse response = bimClashService.resolveClash(clashId, resolverId);

            assertThat(response.status()).isEqualTo(ClashStatus.RESOLVED);
            assertThat(response.resolvedById()).isEqualTo(resolverId);
            assertThat(response.resolvedAt()).isNotNull();
            verify(auditService).logStatusChange("BimClash", clashId, "NEW", "RESOLVED");
        }

        @Test
        @DisplayName("Должна решить коллизию из статуса REVIEWED")
        void resolveClash_FromReviewed() {
            testClash.setStatus(ClashStatus.REVIEWED);
            UUID resolverId = UUID.randomUUID();
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));
            when(bimClashRepository.save(any(BimClash.class))).thenAnswer(inv -> inv.getArgument(0));

            BimClashResponse response = bimClashService.resolveClash(clashId, resolverId);

            assertThat(response.status()).isEqualTo(ClashStatus.RESOLVED);
        }

        @Test
        @DisplayName("Должна отклонить решение уже решённой коллизии")
        void resolveClash_AlreadyResolved() {
            testClash.setStatus(ClashStatus.RESOLVED);
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));

            assertThatThrownBy(() -> bimClashService.resolveClash(clashId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно решить коллизию");
        }
    }

    @Nested
    @DisplayName("Утверждение коллизии")
    class ApproveTests {

        @Test
        @DisplayName("Должна утвердить решённую коллизию")
        void approveClash_FromResolved() {
            testClash.setStatus(ClashStatus.RESOLVED);
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));
            when(bimClashRepository.save(any(BimClash.class))).thenAnswer(inv -> inv.getArgument(0));

            BimClashResponse response = bimClashService.approveClash(clashId);

            assertThat(response.status()).isEqualTo(ClashStatus.APPROVED);
            assertThat(response.statusDisplayName()).isEqualTo("Утверждена");
            verify(auditService).logStatusChange("BimClash", clashId, "RESOLVED", "APPROVED");
        }

        @Test
        @DisplayName("Должна отклонить утверждение новой коллизии")
        void approveClash_FromNew() {
            testClash.setStatus(ClashStatus.NEW);
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));

            assertThatThrownBy(() -> bimClashService.approveClash(clashId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утвердить можно только решённую коллизию");
        }
    }

    @Nested
    @DisplayName("Получение коллизии")
    class GetTests {

        @Test
        @DisplayName("Должна найти коллизию по ID")
        void getClash_Success() {
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));

            BimClashResponse response = bimClashService.getClash(clashId);

            assertThat(response).isNotNull();
            assertThat(response.clashType()).isEqualTo(ClashType.HARD);
            assertThat(response.severity()).isEqualTo(ClashSeverity.HIGH);
            assertThat(response.description()).isEqualTo("Пересечение стены и трубопровода");
        }

        @Test
        @DisplayName("Должна выбросить исключение если коллизия не найдена")
        void getClash_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(bimClashRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bimClashService.getClash(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Коллизия не найдена");
        }
    }

    @Nested
    @DisplayName("Удаление коллизии")
    class DeleteTests {

        @Test
        @DisplayName("Должна мягко удалить коллизию")
        void deleteClash_Success() {
            when(bimClashRepository.findById(clashId)).thenReturn(Optional.of(testClash));
            when(bimClashRepository.save(any(BimClash.class))).thenAnswer(inv -> inv.getArgument(0));

            bimClashService.deleteClash(clashId);

            assertThat(testClash.isDeleted()).isTrue();
            verify(auditService).logDelete("BimClash", clashId);
        }
    }
}
