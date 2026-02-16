package com.privod.platform.modules.mobile;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.mobile.domain.PhotoCapture;
import com.privod.platform.modules.mobile.repository.MobileDeviceRepository;
import com.privod.platform.modules.mobile.repository.OfflineActionRepository;
import com.privod.platform.modules.mobile.repository.PhotoCaptureRepository;
import com.privod.platform.modules.mobile.repository.PushNotificationRepository;
import com.privod.platform.modules.mobile.service.MobileDeviceService;
import com.privod.platform.modules.mobile.web.dto.CreatePhotoCaptureRequest;
import com.privod.platform.modules.mobile.web.dto.PhotoCaptureResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class PhotoCaptureServiceTest {

    @Mock
    private MobileDeviceRepository deviceRepository;

    @Mock
    private PushNotificationRepository pushNotificationRepository;

    @Mock
    private OfflineActionRepository offlineActionRepository;

    @Mock
    private PhotoCaptureRepository photoCaptureRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MobileDeviceService mobileDeviceService;

    @Test
    @DisplayName("Should create photo capture with geo-tagging")
    void createPhoto_WithGeoTag() {
        UUID userId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        CreatePhotoCaptureRequest request = new CreatePhotoCaptureRequest(
                userId, projectId,
                "https://storage.example.com/photo1.jpg",
                "https://storage.example.com/photo1_thumb.jpg",
                55.7558, 37.6173, null,
                "Task", UUID.randomUUID(),
                "Фундамент корпуса А",
                List.of("фундамент", "бетон")
        );

        when(photoCaptureRepository.save(any(PhotoCapture.class))).thenAnswer(inv -> {
            PhotoCapture p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            p.setCreatedAt(Instant.now());
            return p;
        });

        PhotoCaptureResponse response = mobileDeviceService.createPhoto(request);

        assertThat(response.latitude()).isEqualTo(55.7558);
        assertThat(response.longitude()).isEqualTo(37.6173);
        assertThat(response.description()).isEqualTo("Фундамент корпуса А");
        assertThat(response.tags()).containsExactly("фундамент", "бетон");
        verify(auditService).logCreate(eq("PhotoCapture"), any(UUID.class));
    }

    @Test
    @DisplayName("Should find photo by ID")
    void findPhotoById_Success() {
        UUID photoId = UUID.randomUUID();
        PhotoCapture photo = PhotoCapture.builder()
                .userId(UUID.randomUUID())
                .projectId(UUID.randomUUID())
                .photoUrl("https://storage.example.com/photo.jpg")
                .description("Тестовое фото")
                .latitude(55.75)
                .longitude(37.61)
                .takenAt(Instant.now())
                .build();
        photo.setId(photoId);
        photo.setCreatedAt(Instant.now());

        when(photoCaptureRepository.findByIdAndDeletedFalse(photoId)).thenReturn(Optional.of(photo));

        PhotoCaptureResponse response = mobileDeviceService.findPhotoById(photoId);

        assertThat(response.description()).isEqualTo("Тестовое фото");
        assertThat(response.photoUrl()).contains("photo.jpg");
    }

    @Test
    @DisplayName("Should throw when photo not found")
    void findPhotoById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(photoCaptureRepository.findByIdAndDeletedFalse(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mobileDeviceService.findPhotoById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Should soft delete photo")
    void deletePhoto_SoftDeletes() {
        UUID photoId = UUID.randomUUID();
        PhotoCapture photo = PhotoCapture.builder()
                .userId(UUID.randomUUID())
                .photoUrl("https://storage.example.com/photo.jpg")
                .takenAt(Instant.now())
                .build();
        photo.setId(photoId);

        when(photoCaptureRepository.findByIdAndDeletedFalse(photoId)).thenReturn(Optional.of(photo));
        when(photoCaptureRepository.save(any(PhotoCapture.class))).thenReturn(photo);

        mobileDeviceService.deletePhoto(photoId);

        assertThat(photo.isDeleted()).isTrue();
        verify(photoCaptureRepository).save(photo);
        verify(auditService).logDelete("PhotoCapture", photoId);
    }
}
