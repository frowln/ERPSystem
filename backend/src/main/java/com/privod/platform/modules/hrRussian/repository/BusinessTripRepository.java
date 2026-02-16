package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.BusinessTrip;
import com.privod.platform.modules.hrRussian.domain.BusinessTripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessTripRepository extends JpaRepository<BusinessTrip, UUID> {

    List<BusinessTrip> findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(UUID employeeId);

    List<BusinessTrip> findByStatusAndDeletedFalse(BusinessTripStatus status);

    List<BusinessTrip> findByEmployeeIdAndStatusAndDeletedFalse(UUID employeeId, BusinessTripStatus status);
}
