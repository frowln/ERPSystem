package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.PhotoProgress;
import com.privod.platform.modules.bim.repository.PhotoProgressRepository;
import com.privod.platform.modules.bim.web.dto.CreatePhotoProgressRequest;
import com.privod.platform.modules.bim.web.dto.PhotoProgressResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoProgressService {

    private final PhotoProgressRepository photoProgressRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PhotoProgressResponse> listPhotos(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return photoProgressRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(PhotoProgressResponse::fromEntity);
        }
        return photoProgressRepository.findByDeletedFalse(pageable)
                .map(PhotoProgressResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PhotoProgressResponse getPhoto(UUID id) {
        PhotoProgress photo = getPhotoOrThrow(id);
        return PhotoProgressResponse.fromEntity(photo);
    }

    @Transactional
    public PhotoProgressResponse createPhoto(CreatePhotoProgressRequest request) {
        PhotoProgress photo = PhotoProgress.builder()
                .projectId(request.projectId())
                .title(request.title())
                .location(request.location())
                .photoUrl(request.photoUrl())
                .thumbnailUrl(request.thumbnailUrl())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .takenAt(request.takenAt())
                .takenById(request.takenById())
                .weatherCondition(request.weatherCondition())
                .description(request.description())
                .build();

        photo = photoProgressRepository.save(photo);
        auditService.logCreate("PhotoProgress", photo.getId());

        log.info("Photo progress created: {} ({})", photo.getTitle(), photo.getId());
        return PhotoProgressResponse.fromEntity(photo);
    }

    @Transactional
    public PhotoProgressResponse updatePhoto(UUID id, CreatePhotoProgressRequest request) {
        PhotoProgress photo = getPhotoOrThrow(id);

        photo.setProjectId(request.projectId());
        photo.setTitle(request.title());
        photo.setLocation(request.location());
        photo.setPhotoUrl(request.photoUrl());
        photo.setThumbnailUrl(request.thumbnailUrl());
        photo.setLatitude(request.latitude());
        photo.setLongitude(request.longitude());
        photo.setTakenAt(request.takenAt());
        photo.setTakenById(request.takenById());
        photo.setWeatherCondition(request.weatherCondition());
        photo.setDescription(request.description());

        photo = photoProgressRepository.save(photo);
        auditService.logUpdate("PhotoProgress", photo.getId(), "multiple", null, null);

        log.info("Photo progress updated: {} ({})", photo.getTitle(), photo.getId());
        return PhotoProgressResponse.fromEntity(photo);
    }

    @Transactional
    public void deletePhoto(UUID id) {
        PhotoProgress photo = getPhotoOrThrow(id);
        photo.softDelete();
        photoProgressRepository.save(photo);
        auditService.logDelete("PhotoProgress", photo.getId());

        log.info("Photo progress deleted: {} ({})", photo.getTitle(), photo.getId());
    }

    private PhotoProgress getPhotoOrThrow(UUID id) {
        return photoProgressRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Фото прогресса не найдено: " + id));
    }
}
