package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    Page<Employee> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<Employee> findAllByOrganizationId(UUID organizationId);

    Page<Employee> findByStatusAndDeletedFalse(EmployeeStatus status, Pageable pageable);

    Optional<Employee> findByUserIdAndDeletedFalse(UUID userId);

    @Query("SELECT e FROM Employee e WHERE e.deleted = false AND " +
            "(LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.position) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE e.deleted = false AND e.organizationId = :organizationId AND " +
            "(LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.position) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchByOrganizationId(@Param("organizationId") UUID organizationId,
                                          @Param("search") String search,
                                          Pageable pageable);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    @Query("SELECT e FROM Employee e JOIN CrewAssignment ca ON ca.employeeId = e.id " +
            "WHERE ca.projectId = :projectId AND ca.active = true AND e.deleted = false")
    List<Employee> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT e FROM Employee e JOIN CrewAssignment ca ON ca.employeeId = e.id " +
            "WHERE ca.projectId = :projectId AND ca.active = true AND e.deleted = false " +
            "AND e.organizationId = :organizationId")
    List<Employee> findByProjectIdAndOrganizationId(@Param("projectId") UUID projectId,
                                                     @Param("organizationId") UUID organizationId);

    @Query(value = "SELECT nextval('employee_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
