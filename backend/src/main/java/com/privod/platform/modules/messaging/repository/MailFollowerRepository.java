package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailFollower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MailFollowerRepository extends JpaRepository<MailFollower, UUID> {

    @Query("SELECT f FROM MailFollower f WHERE f.modelName = :modelName AND f.recordId = :recordId " +
            "AND f.deleted = false ORDER BY f.createdAt DESC")
    List<MailFollower> findByModelNameAndRecordId(@Param("modelName") String modelName,
                                                  @Param("recordId") UUID recordId);

    @Query("SELECT f FROM MailFollower f WHERE f.userId = :userId AND f.deleted = false " +
            "ORDER BY f.createdAt DESC")
    List<MailFollower> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT f FROM MailFollower f WHERE f.modelName = :modelName AND f.recordId = :recordId " +
            "AND f.userId = :userId AND f.deleted = false")
    Optional<MailFollower> findByModelNameAndRecordIdAndUserId(@Param("modelName") String modelName,
                                                               @Param("recordId") UUID recordId,
                                                               @Param("userId") UUID userId);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM MailFollower f " +
            "WHERE f.modelName = :modelName AND f.recordId = :recordId AND f.userId = :userId " +
            "AND f.deleted = false")
    boolean existsByModelNameAndRecordIdAndUserId(@Param("modelName") String modelName,
                                                  @Param("recordId") UUID recordId,
                                                  @Param("userId") UUID userId);

    @Query("SELECT COUNT(f) FROM MailFollower f WHERE f.modelName = :modelName " +
            "AND f.recordId = :recordId AND f.deleted = false")
    long countByModelNameAndRecordId(@Param("modelName") String modelName,
                                     @Param("recordId") UUID recordId);
}
