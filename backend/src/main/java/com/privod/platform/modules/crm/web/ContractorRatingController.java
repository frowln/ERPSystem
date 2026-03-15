package com.privod.platform.modules.crm.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.crm.domain.ContractorRating;
import com.privod.platform.modules.crm.repository.ContractorRatingRepository;
import com.privod.platform.modules.crm.web.dto.BlacklistRequest;
import com.privod.platform.modules.crm.web.dto.ContractorRatingAverageResponse;
import com.privod.platform.modules.crm.web.dto.ContractorRatingResponse;
import com.privod.platform.modules.crm.web.dto.CreateContractorRatingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/counterparties/{counterpartyId}/ratings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contractor Ratings", description = "Contractor rating and blacklist management")
public class ContractorRatingController {

    private final ContractorRatingRepository ratingRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Add a rating for a counterparty")
    public ResponseEntity<ApiResponse<ContractorRatingResponse>> addRating(
            @PathVariable UUID counterpartyId,
            @Valid @RequestBody CreateContractorRatingRequest request) {

        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        ContractorRating rating = ContractorRating.builder()
                .counterpartyId(counterpartyId)
                .projectId(request.projectId())
                .ratedBy(userId)
                .qualityScore(request.qualityScore())
                .timelinessScore(request.timelinessScore())
                .safetyScore(request.safetyScore())
                .communicationScore(request.communicationScore())
                .priceScore(request.priceScore())
                .comment(request.comment())
                .organizationId(orgId)
                .build();

        rating = ratingRepository.save(rating);
        log.info("Contractor rating added for counterparty {} by user {} ({})",
                counterpartyId, userId, rating.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ContractorRatingResponse.fromEntity(rating)));
    }

    @GetMapping
    @Operation(summary = "List ratings for a counterparty")
    public ResponseEntity<ApiResponse<PageResponse<ContractorRatingResponse>>> listRatings(
            @PathVariable UUID counterpartyId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ContractorRatingResponse> page = ratingRepository
                .findByCounterpartyIdAndDeletedFalse(counterpartyId, pageable)
                .map(ContractorRatingResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/average")
    @Operation(summary = "Get average scores for a counterparty")
    public ResponseEntity<ApiResponse<ContractorRatingAverageResponse>> getAverageRatings(
            @PathVariable UUID counterpartyId) {

        Double quality = ratingRepository.averageQualityScore(counterpartyId);
        Double timeliness = ratingRepository.averageTimelinessScore(counterpartyId);
        Double safety = ratingRepository.averageSafetyScore(counterpartyId);
        Double communication = ratingRepository.averageCommunicationScore(counterpartyId);
        Double price = ratingRepository.averagePriceScore(counterpartyId);
        long totalRatings = ratingRepository.countByCounterpartyIdAndDeletedFalse(counterpartyId);

        int count = 0;
        double sum = 0;
        if (quality != null) { sum += quality; count++; }
        if (timeliness != null) { sum += timeliness; count++; }
        if (safety != null) { sum += safety; count++; }
        if (communication != null) { sum += communication; count++; }
        if (price != null) { sum += price; count++; }

        Double overallAverage = count > 0 ? sum / count : null;

        return ResponseEntity.ok(ApiResponse.ok(new ContractorRatingAverageResponse(
                quality, timeliness, safety, communication, price, overallAverage, totalRatings
        )));
    }

    @PutMapping("/blacklist")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Toggle blacklist status for a counterparty")
    public ResponseEntity<ApiResponse<List<ContractorRatingResponse>>> toggleBlacklist(
            @PathVariable UUID counterpartyId,
            @RequestBody BlacklistRequest request) {

        List<ContractorRating> ratings = ratingRepository
                .findByCounterpartyIdAndDeletedFalse(counterpartyId);

        for (ContractorRating rating : ratings) {
            rating.setBlacklisted(request.blacklisted());
            rating.setBlacklistReason(request.reason());
        }

        // If no ratings exist, create a placeholder rating with blacklist info
        if (ratings.isEmpty() && request.blacklisted()) {
            UUID orgId = SecurityUtils.requireCurrentOrganizationId();
            UUID userId = SecurityUtils.requireCurrentUserId();
            ContractorRating blacklistEntry = ContractorRating.builder()
                    .counterpartyId(counterpartyId)
                    .ratedBy(userId)
                    .blacklisted(true)
                    .blacklistReason(request.reason())
                    .organizationId(orgId)
                    .build();
            ratings = List.of(ratingRepository.save(blacklistEntry));
        } else {
            ratings = ratingRepository.saveAll(ratings);
        }

        log.info("Counterparty {} blacklist toggled to {}", counterpartyId, request.blacklisted());

        List<ContractorRatingResponse> responses = ratings.stream()
                .map(ContractorRatingResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
