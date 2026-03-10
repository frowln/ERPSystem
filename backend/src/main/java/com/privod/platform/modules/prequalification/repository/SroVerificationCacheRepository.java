package com.privod.platform.modules.prequalification.repository;

import com.privod.platform.modules.prequalification.domain.SroVerificationCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SroVerificationCacheRepository extends JpaRepository<SroVerificationCache, UUID> {

    /**
     * Найти актуальную запись кэша по ИНН (самую свежую).
     */
    Optional<SroVerificationCache> findFirstByInnOrderByCachedAtDesc(String inn);

    /**
     * Найти актуальную запись кэша, которая ещё не протухла (моложе заданного момента).
     */
    @Query("SELECT s FROM SroVerificationCache s WHERE s.inn = :inn AND s.cachedAt > :threshold ORDER BY s.cachedAt DESC LIMIT 1")
    Optional<SroVerificationCache> findFreshByInn(@Param("inn") String inn,
                                                   @Param("threshold") LocalDateTime threshold);

    /**
     * История всех проверок (для аудита), отсортированная по дате.
     */
    List<SroVerificationCache> findAllByOrderByCachedAtDesc();

    /**
     * История проверок конкретного ИНН.
     */
    List<SroVerificationCache> findByInnOrderByCachedAtDesc(String inn);

    /**
     * Удалить устаревшие записи кэша старше заданной даты.
     */
    void deleteAllByCachedAtBefore(LocalDateTime threshold);
}
