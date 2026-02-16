package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MailTemplateRepository extends JpaRepository<MailTemplate, UUID> {

    @Query("SELECT t FROM MailTemplate t WHERE t.isActive = true AND t.deleted = false ORDER BY t.name ASC")
    List<MailTemplate> findAllActive();

    @Query("SELECT t FROM MailTemplate t WHERE t.modelName = :modelName AND t.isActive = true " +
            "AND t.deleted = false ORDER BY t.name ASC")
    List<MailTemplate> findByModelName(@Param("modelName") String modelName);

    @Query("SELECT t FROM MailTemplate t WHERE t.name = :name AND t.isActive = true AND t.deleted = false")
    Optional<MailTemplate> findByName(@Param("name") String name);

    @Query("SELECT t FROM MailTemplate t WHERE t.modelName = :modelName AND t.lang = :lang " +
            "AND t.isActive = true AND t.deleted = false ORDER BY t.name ASC")
    List<MailTemplate> findByModelNameAndLang(@Param("modelName") String modelName,
                                              @Param("lang") String lang);
}
