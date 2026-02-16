package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateMaterialRequest;
import com.privod.platform.modules.warehouse.web.dto.MaterialResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateMaterialRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MaterialService materialService;

    private UUID materialId;
    private Material testMaterial;

    @BeforeEach
    void setUp() {
        materialId = UUID.randomUUID();

        testMaterial = Material.builder()
                .name("Cement M400")
                .code("MAT-001")
                .category(MaterialCategory.BUILDING_MATERIALS)
                .unitOfMeasure("ton")
                .description("Portland cement grade M400")
                .minStockLevel(new BigDecimal("10.00"))
                .currentPrice(new BigDecimal("5000.00"))
                .active(true)
                .build();
        testMaterial.setId(materialId);
        testMaterial.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Material")
    class CreateTests {

        @Test
        @DisplayName("Should create material successfully")
        void shouldCreate_whenValidInput() {
            CreateMaterialRequest request = new CreateMaterialRequest(
                    "Rebar A500", "MAT-002", MaterialCategory.METALS,
                    "ton", "Reinforcing steel", new BigDecimal("5.00"),
                    new BigDecimal("45000.00"));

            when(materialRepository.existsByCodeAndDeletedFalse("MAT-002")).thenReturn(false);
            when(materialRepository.save(any(Material.class))).thenAnswer(inv -> {
                Material m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            MaterialResponse response = materialService.createMaterial(request);

            assertThat(response.name()).isEqualTo("Rebar A500");
            assertThat(response.active()).isTrue();
            verify(auditService).logCreate(eq("Material"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate code")
        void shouldThrowException_whenDuplicateCode() {
            CreateMaterialRequest request = new CreateMaterialRequest(
                    "Duplicate", "MAT-001", MaterialCategory.BUILDING_MATERIALS,
                    "ton", null, null, null);

            when(materialRepository.existsByCodeAndDeletedFalse("MAT-001")).thenReturn(true);

            assertThatThrownBy(() -> materialService.createMaterial(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("MAT-001");
        }

        @Test
        @DisplayName("Should default min stock and price to ZERO when null")
        void shouldDefaultToZero_whenNull() {
            CreateMaterialRequest request = new CreateMaterialRequest(
                    "Basic Material", "MAT-003", MaterialCategory.OTHER,
                    "piece", null, null, null);

            when(materialRepository.existsByCodeAndDeletedFalse("MAT-003")).thenReturn(false);
            when(materialRepository.save(any(Material.class))).thenAnswer(inv -> {
                Material m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            MaterialResponse response = materialService.createMaterial(request);

            assertThat(response.minStockLevel()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.currentPrice()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Update Material")
    class UpdateTests {

        @Test
        @DisplayName("Should update material name and price")
        void shouldUpdate_whenValidInput() {
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateMaterialRequest request = new UpdateMaterialRequest(
                    "Cement M500", null, null, null, "Upgraded cement",
                    null, new BigDecimal("6000.00"), null);

            MaterialResponse response = materialService.updateMaterial(materialId, request);

            assertThat(response.name()).isEqualTo("Cement M500");
            assertThat(response.currentPrice()).isEqualByComparingTo(new BigDecimal("6000.00"));
            verify(auditService).logUpdate(eq("Material"), eq(materialId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject duplicate code on update")
        void shouldThrowException_whenDuplicateCodeOnUpdate() {
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));
            when(materialRepository.existsByCodeAndDeletedFalse("MAT-EXISTING")).thenReturn(true);

            UpdateMaterialRequest request = new UpdateMaterialRequest(
                    null, "MAT-EXISTING", null, null, null,
                    null, null, null);

            assertThatThrownBy(() -> materialService.updateMaterial(materialId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("MAT-EXISTING");
        }

        @Test
        @DisplayName("Should allow same code on update (no change)")
        void shouldAllow_whenSameCode() {
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateMaterialRequest request = new UpdateMaterialRequest(
                    null, "MAT-001", null, null, null,
                    null, null, null);

            MaterialResponse response = materialService.updateMaterial(materialId, request);

            assertThat(response.code()).isEqualTo("MAT-001");
        }
    }

    @Test
    @DisplayName("Should find material by ID")
    void shouldReturnMaterial_whenExists() {
        when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));

        MaterialResponse response = materialService.getMaterial(materialId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("MAT-001");
        assertThat(response.name()).isEqualTo("Cement M400");
    }

    @Test
    @DisplayName("Should throw when material not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(materialRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> materialService.getMaterial(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Материал не найден");
    }

    @Test
    @DisplayName("Should soft delete material")
    void shouldSoftDelete_whenValidId() {
        when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));
        when(materialRepository.save(any(Material.class))).thenAnswer(inv -> inv.getArgument(0));

        materialService.deleteMaterial(materialId);

        assertThat(testMaterial.isDeleted()).isTrue();
        verify(auditService).logDelete("Material", materialId);
    }
}
