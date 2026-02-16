package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.PhotoAlbum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PhotoAlbumRepository extends JpaRepository<PhotoAlbum, UUID> {

    Page<PhotoAlbum> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PhotoAlbum> findByDeletedFalse(Pageable pageable);
}
