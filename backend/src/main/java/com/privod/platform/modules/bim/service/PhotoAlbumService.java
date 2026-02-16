package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.PhotoAlbum;
import com.privod.platform.modules.bim.repository.PhotoAlbumRepository;
import com.privod.platform.modules.bim.web.dto.CreatePhotoAlbumRequest;
import com.privod.platform.modules.bim.web.dto.PhotoAlbumResponse;
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
public class PhotoAlbumService {

    private final PhotoAlbumRepository photoAlbumRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PhotoAlbumResponse> listAlbums(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return photoAlbumRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(PhotoAlbumResponse::fromEntity);
        }
        return photoAlbumRepository.findByDeletedFalse(pageable)
                .map(PhotoAlbumResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PhotoAlbumResponse getAlbum(UUID id) {
        PhotoAlbum album = getAlbumOrThrow(id);
        return PhotoAlbumResponse.fromEntity(album);
    }

    @Transactional
    public PhotoAlbumResponse createAlbum(CreatePhotoAlbumRequest request) {
        PhotoAlbum album = PhotoAlbum.builder()
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .coverPhotoId(request.coverPhotoId())
                .build();

        album = photoAlbumRepository.save(album);
        auditService.logCreate("PhotoAlbum", album.getId());

        log.info("Photo album created: {} ({})", album.getName(), album.getId());
        return PhotoAlbumResponse.fromEntity(album);
    }

    @Transactional
    public PhotoAlbumResponse updateAlbum(UUID id, CreatePhotoAlbumRequest request) {
        PhotoAlbum album = getAlbumOrThrow(id);

        album.setProjectId(request.projectId());
        album.setName(request.name());
        album.setDescription(request.description());
        album.setCoverPhotoId(request.coverPhotoId());

        album = photoAlbumRepository.save(album);
        auditService.logUpdate("PhotoAlbum", album.getId(), "multiple", null, null);

        log.info("Photo album updated: {} ({})", album.getName(), album.getId());
        return PhotoAlbumResponse.fromEntity(album);
    }

    @Transactional
    public void deleteAlbum(UUID id) {
        PhotoAlbum album = getAlbumOrThrow(id);
        album.softDelete();
        photoAlbumRepository.save(album);
        auditService.logDelete("PhotoAlbum", album.getId());

        log.info("Photo album deleted: {} ({})", album.getName(), album.getId());
    }

    private PhotoAlbum getAlbumOrThrow(UUID id) {
        return photoAlbumRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Фотоальбом не найден: " + id));
    }
}
