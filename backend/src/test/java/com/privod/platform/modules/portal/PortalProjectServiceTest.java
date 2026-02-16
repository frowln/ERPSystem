package com.privod.platform.modules.portal;

import com.privod.platform.modules.portal.domain.PortalAccessLevel;
import com.privod.platform.modules.portal.domain.PortalProject;
import com.privod.platform.modules.portal.repository.PortalDocumentRepository;
import com.privod.platform.modules.portal.repository.PortalProjectRepository;
import com.privod.platform.modules.portal.service.PortalProjectService;
import com.privod.platform.modules.portal.web.dto.GrantPortalProjectAccessRequest;
import com.privod.platform.modules.portal.web.dto.PortalProjectResponse;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortalProjectServiceTest {

    @Mock
    private PortalProjectRepository portalProjectRepository;

    @Mock
    private PortalDocumentRepository portalDocumentRepository;

    @InjectMocks
    private PortalProjectService portalProjectService;

    private UUID portalUserId;
    private UUID projectId;
    private PortalProject testPortalProject;

    @BeforeEach
    void setUp() {
        portalUserId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPortalProject = PortalProject.builder()
                .portalUserId(portalUserId)
                .projectId(projectId)
                .accessLevel(PortalAccessLevel.VIEW_ONLY)
                .canViewDocuments(true)
                .canViewSchedule(true)
                .canViewFinance(false)
                .canViewPhotos(false)
                .grantedById(UUID.randomUUID())
                .grantedAt(Instant.now())
                .build();
        testPortalProject.setId(UUID.randomUUID());
        testPortalProject.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Get My Projects")
    class GetMyProjectsTests {

        @Test
        @DisplayName("Should return paginated projects for portal user")
        void getMyProjects_ReturnsList() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<PortalProject> page = new PageImpl<>(List.of(testPortalProject), pageable, 1);

            when(portalProjectRepository.findByPortalUserIdAndDeletedFalse(portalUserId, pageable))
                    .thenReturn(page);

            Page<PortalProjectResponse> result = portalProjectService.getMyProjects(portalUserId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).projectId()).isEqualTo(projectId);
            assertThat(result.getContent().get(0).accessLevel()).isEqualTo(PortalAccessLevel.VIEW_ONLY);
        }
    }

    @Nested
    @DisplayName("Grant Access")
    class GrantAccessTests {

        @Test
        @DisplayName("Should grant new project access to portal user")
        void grantAccess_NewAccess() {
            GrantPortalProjectAccessRequest request = new GrantPortalProjectAccessRequest(
                    portalUserId, projectId, PortalAccessLevel.FULL,
                    true, true, true, true, UUID.randomUUID()
            );

            when(portalProjectRepository.existsByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId))
                    .thenReturn(false);
            when(portalProjectRepository.save(any(PortalProject.class))).thenAnswer(inv -> {
                PortalProject pp = inv.getArgument(0);
                pp.setId(UUID.randomUUID());
                pp.setCreatedAt(Instant.now());
                return pp;
            });

            PortalProjectResponse response = portalProjectService.grantAccess(request);

            assertThat(response.accessLevel()).isEqualTo(PortalAccessLevel.FULL);
            assertThat(response.canViewFinance()).isTrue();
            assertThat(response.canViewDocuments()).isTrue();
        }
    }

    @Nested
    @DisplayName("Revoke Access")
    class RevokeAccessTests {

        @Test
        @DisplayName("Should revoke access by soft-deleting")
        void revokeAccess_SoftDeletes() {
            when(portalProjectRepository.findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId))
                    .thenReturn(Optional.of(testPortalProject));
            when(portalProjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            portalProjectService.revokeAccess(portalUserId, projectId);

            assertThat(testPortalProject.isDeleted()).isTrue();
            verify(portalProjectRepository).save(testPortalProject);
        }

        @Test
        @DisplayName("Should throw when access not found")
        void revokeAccess_NotFound() {
            when(portalProjectRepository.findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> portalProjectService.revokeAccess(portalUserId, projectId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Доступ к проекту не найден");
        }
    }
}
