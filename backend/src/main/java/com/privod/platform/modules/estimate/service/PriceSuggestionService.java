package com.privod.platform.modules.estimate.service;

import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.web.dto.PriceSuggestionResponse;
import com.privod.platform.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceSuggestionService {

    private final EstimateItemRepository estimateItemRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public PriceSuggestionResponse getSuggestions(String name) {
        if (name == null || name.trim().length() < 3) {
            return new PriceSuggestionResponse(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    0, Collections.emptyList()
            );
        }

        String searchTerm = name.trim();

        long matchCount = estimateItemRepository.countByNameContainingAndUnitPricePositive(searchTerm);
        if (matchCount == 0) {
            return new PriceSuggestionResponse(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    0, Collections.emptyList()
            );
        }

        BigDecimal avgPrice = estimateItemRepository.avgUnitPriceByNameContaining(searchTerm);
        BigDecimal minPrice = estimateItemRepository.minUnitPriceByNameContaining(searchTerm);
        BigDecimal maxPrice = estimateItemRepository.maxUnitPriceByNameContaining(searchTerm);

        // Calculate median
        List<BigDecimal> allPrices = estimateItemRepository.findAllUnitPricesByNameContaining(searchTerm);
        BigDecimal medianPrice = calculateMedian(allPrices);

        // Get up to 5 recent matches
        List<EstimateItem> recentItems = estimateItemRepository.findByNameContainingAndUnitPricePositive(
                searchTerm,
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        // Resolve project names for matches
        List<UUID> projectIds = recentItems.stream()
                .map(EstimateItem::getProjectId)
                .distinct()
                .toList();

        Map<UUID, String> projectNames = Collections.emptyMap();
        if (!projectIds.isEmpty()) {
            projectNames = projectRepository.findNamesByIds(projectIds)
                    .stream()
                    .collect(Collectors.toMap(
                            row -> (UUID) row[0],
                            row -> (String) row[1],
                            (a, b) -> a
                    ));
        }

        Map<UUID, String> finalProjectNames = projectNames;
        List<PriceSuggestionResponse.MatchItem> matches = recentItems.stream()
                .map(item -> new PriceSuggestionResponse.MatchItem(
                        item.getName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        finalProjectNames.getOrDefault(item.getProjectId(), null)
                ))
                .toList();

        return new PriceSuggestionResponse(
                avgPrice != null ? avgPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO,
                minPrice != null ? minPrice : BigDecimal.ZERO,
                maxPrice != null ? maxPrice : BigDecimal.ZERO,
                medianPrice != null ? medianPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO,
                (int) matchCount,
                matches
        );
    }

    private BigDecimal calculateMedian(List<BigDecimal> sortedPrices) {
        if (sortedPrices == null || sortedPrices.isEmpty()) {
            return BigDecimal.ZERO;
        }
        int size = sortedPrices.size();
        if (size % 2 == 1) {
            return sortedPrices.get(size / 2);
        } else {
            BigDecimal a = sortedPrices.get(size / 2 - 1);
            BigDecimal b = sortedPrices.get(size / 2);
            return a.add(b).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
    }
}
