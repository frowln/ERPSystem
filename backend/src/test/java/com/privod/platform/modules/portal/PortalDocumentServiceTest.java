package com.privod.platform.modules.portal;

import com.privod.platform.modules.portal.domain.PortalDocument;
import com.privod.platform.modules.portal.repository.PortalDocumentRepository;
import com.privod.platform.modules.portal.service.PortalDocumentService;
import com.privod.platform.modules.portal.web.dto.PortalDocumentResponse;
import com.privod.platform.modules.portal.web.dto.ShareDocumentRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortalDocumentServiceTest {

    @Mock
    private PortalDocumentRepository portalDocumentRepository;

    @InjectMocks
    private PortalDocumentService portalDocumentService;

    private UUID portalUserId;
    private UUID documentId;
    private UUID projectId;
    private PortalDocument testPortalDocument;

    @BeforeEach
    void setUp() {
        portalUserId = UUID.randomUUID();
        documentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPortalDocument = PortalDocument.builder()
                .portalUserId(portalUserId)
                .projectId(projectId)
                .documentId(documentId)
                .sharedById(UUID.randomUUID())
                .sharedAt(Instant.now())
                .downloadCount(0)
                .build();
        testPortalDocument.setId(UUID.randomUUID());
        testPortalDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Download")
    class DownloadTests {

        @Test
        @DisplayName("Should increment download count on download")
        void download_IncrementsCount() {
            when(portalDocumentRepository.findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId))
                    .thenReturn(Optional.of(testPortalDocument));
            when(portalDocumentRepository.save(any(PortalDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            PortalDocumentResponse response = portalDocumentService.download(portalUserId, documentId);

            assertThat(response.downloadCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should throw when document expired")
        void download_Expired() {
            testPortalDocument.setExpiresAt(Instant.now().minusSeconds(3600));

            when(portalDocumentRepository.findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId))
                    .thenReturn(Optional.of(testPortalDocument));

            assertThatThrownBy(() -> portalDocumentService.download(portalUserId, documentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Срок доступа к документу истек");
        }

        @Test
        @DisplayName("Should throw when document not shared")
        void download_NotFound() {
            when(portalDocumentRepository.findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> portalDocumentService.download(portalUserId, documentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ не найден");
        }
    }

    @Nested
    @DisplayName("Share Document")
    class ShareDocumentTests {

        @Test
        @DisplayName("Should share document with portal user")
        void shareDocument_Success() {
            ShareDocumentRequest request = new ShareDocumentRequest(
                    portalUserId, documentId, projectId, UUID.randomUUID(), null
            );

            when(portalDocumentRepository.findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId))
                    .thenReturn(Optional.empty());
            when(portalDocumentRepository.save(any(PortalDocument.class))).thenAnswer(inv -> {
                PortalDocument pd = inv.getArgument(0);
                pd.setId(UUID.randomUUID());
                pd.setCreatedAt(Instant.now());
                return pd;
            });

            PortalDocumentResponse response = portalDocumentService.shareDocument(request);

            assertThat(response.portalUserId()).isEqualTo(portalUserId);
            assertThat(response.documentId()).isEqualTo(documentId);
            assertThat(response.downloadCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should throw when document already shared")
        void shareDocument_AlreadyShared() {
            ShareDocumentRequest request = new ShareDocumentRequest(
                    portalUserId, documentId, projectId, UUID.randomUUID(), null
            );

            when(portalDocumentRepository.findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId))
                    .thenReturn(Optional.of(testPortalDocument));

            assertThatThrownBy(() -> portalDocumentService.shareDocument(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже предоставлен");
        }
    }
}
