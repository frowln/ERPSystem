package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.ActivityCategory;
import com.privod.platform.modules.messaging.domain.MailActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MailActivityTypeRepository extends JpaRepository<MailActivityType, UUID> {

    @Query("SELECT t FROM MailActivityType t WHERE t.deleted = false ORDER BY t.name ASC")
    List<MailActivityType> findAllActive();

    @Query("SELECT t FROM MailActivityType t WHERE t.category = :category AND t.deleted = false " +
            "ORDER BY t.name ASC")
    List<MailActivityType> findByCategory(@Param("category") ActivityCategory category);

    @Query("SELECT t FROM MailActivityType t WHERE t.name = :name AND t.deleted = false")
    Optional<MailActivityType> findByName(@Param("name") String name);
}
