package com.privod.platform.modules.cde;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.RevisionSet;
import com.privod.platform.modules.cde.repository.RevisionSetRepository;
import com.privod.platform.modules.cde.service.RevisionSetService;
import com.privod.platform.modules.cde.web.dto.CreateRevisionSetRequest;
import com.privod.platform.modules.cde.web.dto.RevisionSetResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevisionSetServiceTest {

    @Mock
    private RevisionSetRepository revisionSetRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevisionSetService revisionSetService;

    private UUID setId;
    private RevisionSet testSet;

    @BeforeEach
    void setUp() {
        setId = UUID.randomUUID();
        testSet = RevisionSet.builder()
                .projectId(UUID.randomUUID())
                .name("Набор ревизий v1.0")
                .description("Первый набор ревизий проекта")
                .revisionIds("[\"" + UUID.randomUUID() + "\"]")
                .issuedDate(LocalDate.now())
                .build();
        testSet.setId(setId);
        testSet.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Создание набора ревизий")
    void create_Success() {
        CreateRevisionSetRequest request = new CreateRevisionSetRequest(
                UUID.randomUUID(), "Набор v2.0", "Описание",
                "[\"" + UUID.randomUUID() + "\"]", LocalDate.now(), UUID.randomUUID());

        when(revisionSetRepository.save(any(RevisionSet.class))).thenAnswer(inv -> {
            RevisionSet s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            s.setCreatedAt(Instant.now());
            return s;
        });

        RevisionSetResponse response = revisionSetService.create(request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Набор v2.0");
        verify(auditService).logCreate(eq("RevisionSet"), any(UUID.class));
    }

    @Test
    @DisplayName("Получение набора ревизий по ID")
    void findById_Success() {
        when(revisionSetRepository.findById(setId)).thenReturn(Optional.of(testSet));

        RevisionSetResponse response = revisionSetService.findById(setId);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Набор ревизий v1.0");
    }

    @Test
    @DisplayName("Ошибка при поиске несуществующего набора ревизий")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(revisionSetRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> revisionSetService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Набор ревизий не найден");
    }

    @Test
    @DisplayName("Мягкое удаление набора ревизий")
    void delete_SoftDeletes() {
        when(revisionSetRepository.findById(setId)).thenReturn(Optional.of(testSet));
        when(revisionSetRepository.save(any(RevisionSet.class))).thenReturn(testSet);

        revisionSetService.delete(setId);

        assertThat(testSet.isDeleted()).isTrue();
        verify(revisionSetRepository).save(testSet);
        verify(auditService).logDelete("RevisionSet", setId);
    }
}
