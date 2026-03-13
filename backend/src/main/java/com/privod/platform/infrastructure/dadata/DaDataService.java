package com.privod.platform.infrastructure.dadata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * P2-CRM-1: DaData integration for counterparty auto-fill by INN/OGRN.
 * API docs: https://dadata.ru/api/find-party/
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DaDataService {

    private static final String DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

    private final RestTemplate restTemplate;

    @Value("${app.dadata.token:}")
    private String token;

    /**
     * Look up a legal entity by INN (10/12 digits) or OGRN.
     *
     * @return populated {@link DaDataParty} or empty if not found / token not configured
     */
    public Optional<DaDataParty> findByInn(String inn) {
        if (inn == null || inn.isBlank()) return Optional.empty();
        if (token == null || token.isBlank()) {
            log.warn("DaData token not configured (app.dadata.token). Skipping lookup.");
            return Optional.empty();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Token " + token);
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> requestBody = Map.of("query", inn, "count", 1);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<DaDataResponse> response = restTemplate.exchange(
                    DADATA_URL, HttpMethod.POST, entity, DaDataResponse.class);

            if (response.getBody() == null || response.getBody().getSuggestions() == null
                    || response.getBody().getSuggestions().isEmpty()) {
                return Optional.empty();
            }

            Suggestion suggestion = response.getBody().getSuggestions().get(0);
            if (suggestion.getData() == null) return Optional.empty();

            return Optional.of(mapToParty(suggestion));
        } catch (Exception e) {
            log.error("DaData lookup failed for INN={}: {}", inn, e.getMessage());
            return Optional.empty();
        }
    }

    private DaDataParty mapToParty(Suggestion suggestion) {
        SuggestionData d = suggestion.getData();
        DaDataParty party = new DaDataParty();
        party.setInn(d.getInn());
        party.setKpp(d.getKpp());
        party.setOgrn(d.getOgrn());
        party.setOpf(d.getOpf() != null ? d.getOpf().getShort() : null);

        // Name: use short_with_opf for display, full for storage
        if (d.getName() != null) {
            party.setShortName(d.getName().getShortWithOpf());
            party.setFullName(d.getName().getFull());
        } else {
            party.setShortName(suggestion.getValue());
            party.setFullName(suggestion.getValue());
        }

        // Address
        if (d.getAddress() != null) {
            party.setLegalAddress(d.getAddress().getValue());
        }

        // Contacts — head / management
        if (d.getManagement() != null) {
            party.setDirectorName(d.getManagement().getName());
            party.setDirectorPost(d.getManagement().getPost());
        }

        // Status
        party.setActive(d.getState() == null || !"LIQUIDATED".equals(d.getState().getStatus()));

        return party;
    }

    // ─── Response DTOs ────────────────────────────────────────────────────────

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DaDataResponse {
        private List<Suggestion> suggestions;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Suggestion {
        private String value;
        private String unrestricted_value;
        private SuggestionData data;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SuggestionData {
        private String inn;
        private String kpp;
        private String ogrn;
        private OpfInfo opf;
        private NameInfo name;
        private AddressInfo address;
        private ManagementInfo management;
        private StateInfo state;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OpfInfo {
        @JsonProperty("short")
        private String short_;

        public String getShort() { return short_; }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NameInfo {
        @JsonProperty("short_with_opf")
        private String shortWithOpf;
        @JsonProperty("full_with_opf")
        private String fullWithOpf;
        @JsonProperty("full")
        private String full;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AddressInfo {
        private String value;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ManagementInfo {
        private String name;
        private String post;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StateInfo {
        private String status; // ACTIVE | LIQUIDATING | LIQUIDATED | BANKRUPT | REORGANIZING
    }
}
