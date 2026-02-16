package com.privod.platform.modules.integration.weather.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.weather.domain.WeatherApiProvider;
import com.privod.platform.modules.integration.weather.domain.WeatherConfig;
import com.privod.platform.modules.integration.weather.domain.WeatherData;
import com.privod.platform.modules.integration.weather.repository.WeatherConfigRepository;
import com.privod.platform.modules.integration.weather.repository.WeatherDataRepository;
import com.privod.platform.modules.integration.weather.web.dto.UpdateWeatherConfigRequest;
import com.privod.platform.modules.integration.weather.web.dto.WeatherConfigResponse;
import com.privod.platform.modules.integration.weather.web.dto.WeatherDataResponse;
import com.privod.platform.modules.integration.weather.web.dto.WeatherSafetyResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherService {

    private final WeatherConfigRepository configRepository;
    private final WeatherDataRepository weatherDataRepository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final double UNSAFE_WIND_SPEED_MS = 20.0;
    private static final double UNSAFE_TEMP_LOW = -25.0;
    private static final List<String> UNSAFE_CONDITIONS = List.of(
            "Thunderstorm", "Tornado", "Hurricane", "Blizzard"
    );

    // === Config Management ===

    @Transactional(readOnly = true)
    public WeatherConfigResponse getConfig() {
        WeatherConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElseGet(() -> {
                    List<WeatherConfig> all = configRepository.findByDeletedFalse();
                    return all.isEmpty() ? null : all.get(0);
                });

        if (config == null) {
            throw new EntityNotFoundException("Конфигурация погодного API не найдена");
        }

        return WeatherConfigResponse.fromEntity(config);
    }

    @Transactional
    public WeatherConfigResponse updateConfig(UpdateWeatherConfigRequest request) {
        WeatherConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElseGet(() -> {
                    List<WeatherConfig> all = configRepository.findByDeletedFalse();
                    return all.isEmpty() ? null : all.get(0);
                });

        if (config == null) {
            config = WeatherConfig.builder()
                    .apiProvider(request.apiProvider())
                    .apiKey(request.apiKey())
                    .defaultCity(request.defaultCity())
                    .defaultLatitude(request.defaultLatitude())
                    .defaultLongitude(request.defaultLongitude())
                    .enabled(request.enabled())
                    .refreshIntervalMinutes(request.refreshIntervalMinutes())
                    .build();

            config = configRepository.save(config);
            auditService.logCreate("WeatherConfig", config.getId());
            log.info("Конфигурация погодного API создана: {} ({})",
                    config.getApiProvider().getDisplayName(), config.getId());
        } else {
            config.setApiProvider(request.apiProvider());
            if (request.apiKey() != null && !request.apiKey().isBlank()) {
                config.setApiKey(request.apiKey());
            }
            config.setDefaultCity(request.defaultCity());
            config.setDefaultLatitude(request.defaultLatitude());
            config.setDefaultLongitude(request.defaultLongitude());
            config.setEnabled(request.enabled());
            config.setRefreshIntervalMinutes(request.refreshIntervalMinutes());

            config = configRepository.save(config);
            auditService.logUpdate("WeatherConfig", config.getId(), "config", null, null);
            log.info("Конфигурация погодного API обновлена: {} ({})",
                    config.getApiProvider().getDisplayName(), config.getId());
        }

        return WeatherConfigResponse.fromEntity(config);
    }

    // === Weather Data ===

    @Transactional
    public WeatherDataResponse fetchCurrentWeather(double latitude, double longitude) {
        log.info("Запрос текущей погоды: lat={}, lon={}", latitude, longitude);

        WeatherConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElse(null);

        WeatherData data;
        if (config != null && config.getApiKey() != null && !config.getApiKey().isBlank()) {
            data = fetchFromExternalApi(config, latitude, longitude, null);
        } else {
            log.warn("API-ключ не настроен, используются демо-данные");
            data = generateMockWeatherData(latitude, longitude, null);
        }

        boolean safe = assessWorkSafety(data);
        data.setSafeForWork(safe);

        data = weatherDataRepository.save(data);
        log.info("Данные погоды сохранены: {} (id={}), безопасность={}",
                data.getLocationName(), data.getId(), safe);

        return WeatherDataResponse.fromEntity(data);
    }

    @Transactional
    public WeatherDataResponse fetchWeatherForProject(UUID projectId) {
        log.info("Запрос погоды для проекта: {}", projectId);

        WeatherConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElse(null);

        double latitude = config != null && config.getDefaultLatitude() != null
                ? config.getDefaultLatitude() : 55.7558;
        double longitude = config != null && config.getDefaultLongitude() != null
                ? config.getDefaultLongitude() : 37.6173;

        WeatherData data;
        if (config != null && config.getApiKey() != null && !config.getApiKey().isBlank()) {
            data = fetchFromExternalApi(config, latitude, longitude, projectId);
        } else {
            log.warn("API-ключ не настроен, используются демо-данные для проекта {}", projectId);
            data = generateMockWeatherData(latitude, longitude, projectId);
        }

        boolean safe = assessWorkSafety(data);
        data.setSafeForWork(safe);

        data = weatherDataRepository.save(data);
        log.info("Данные погоды для проекта {} сохранены (id={}), безопасность={}",
                projectId, data.getId(), safe);

        return WeatherDataResponse.fromEntity(data);
    }

    @Transactional(readOnly = true)
    public WeatherDataResponse getLatestWeather(UUID projectId) {
        WeatherData data = weatherDataRepository
                .findFirstByProjectIdAndDeletedFalseOrderByFetchedAtDesc(projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Данные погоды не найдены для проекта: " + projectId));
        return WeatherDataResponse.fromEntity(data);
    }

    @Transactional(readOnly = true)
    public List<WeatherDataResponse> getForecast(UUID projectId, int days) {
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant to = Instant.now();

        List<WeatherData> history = weatherDataRepository
                .findByProjectIdAndFetchedAtBetweenAndDeletedFalseOrderByFetchedAtDesc(
                        projectId, from, to);

        if (history.isEmpty()) {
            log.info("Нет исторических данных для прогноза проекта {}, генерируем демо-прогноз", projectId);
            List<WeatherDataResponse> forecast = new ArrayList<>();
            for (int i = 0; i < days; i++) {
                WeatherData mockData = generateMockWeatherData(55.7558, 37.6173, projectId);
                mockData.setFetchedAt(Instant.now().plus(i + 1, ChronoUnit.DAYS));
                boolean safe = assessWorkSafety(mockData);
                mockData.setSafeForWork(safe);
                forecast.add(WeatherDataResponse.fromEntity(mockData));
            }
            return forecast;
        }

        return history.stream()
                .map(WeatherDataResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public WeatherSafetyResponse assessSafety(UUID projectId) {
        WeatherData data = weatherDataRepository
                .findFirstByProjectIdAndDeletedFalseOrderByFetchedAtDesc(projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Данные погоды не найдены для проекта: " + projectId));

        boolean safe = assessWorkSafety(data);
        List<String> warnings = buildWarnings(data);
        String assessment = safe
                ? "Условия безопасны для проведения работ"
                : "Условия НЕБЕЗОПАСНЫ для проведения работ";

        return new WeatherSafetyResponse(
                projectId,
                safe,
                assessment,
                warnings,
                WeatherDataResponse.fromEntity(data),
                Instant.now()
        );
    }

    // === Safety Assessment ===

    public boolean assessWorkSafety(WeatherData data) {
        if (data.getWindSpeed() != null && data.getWindSpeed() > UNSAFE_WIND_SPEED_MS) {
            return false;
        }
        if (data.getTemperature() != null && data.getTemperature() < UNSAFE_TEMP_LOW) {
            return false;
        }
        if (data.getWeatherCondition() != null) {
            for (String condition : UNSAFE_CONDITIONS) {
                if (data.getWeatherCondition().equalsIgnoreCase(condition)) {
                    return false;
                }
            }
        }
        return true;
    }

    // === Private Helpers ===

    private List<String> buildWarnings(WeatherData data) {
        List<String> warnings = new ArrayList<>();

        if (data.getWindSpeed() != null && data.getWindSpeed() > UNSAFE_WIND_SPEED_MS) {
            warnings.add(String.format("Скорость ветра %.1f м/с превышает безопасный порог %.1f м/с",
                    data.getWindSpeed(), UNSAFE_WIND_SPEED_MS));
        }
        if (data.getWindSpeed() != null && data.getWindSpeed() > 15.0 && data.getWindSpeed() <= UNSAFE_WIND_SPEED_MS) {
            warnings.add(String.format("Сильный ветер %.1f м/с — соблюдайте осторожность", data.getWindSpeed()));
        }
        if (data.getTemperature() != null && data.getTemperature() < UNSAFE_TEMP_LOW) {
            warnings.add(String.format("Температура %.1f°C ниже безопасного порога %.1f°C",
                    data.getTemperature(), UNSAFE_TEMP_LOW));
        }
        if (data.getTemperature() != null && data.getTemperature() < -15.0 && data.getTemperature() >= UNSAFE_TEMP_LOW) {
            warnings.add(String.format("Низкая температура %.1f°C — сокращённый режим работы", data.getTemperature()));
        }
        if (data.getWeatherCondition() != null) {
            for (String condition : UNSAFE_CONDITIONS) {
                if (data.getWeatherCondition().equalsIgnoreCase(condition)) {
                    warnings.add("Опасные погодные условия: " + data.getWeatherCondition());
                }
            }
        }
        if (data.getVisibility() != null && data.getVisibility() < 200) {
            warnings.add(String.format("Низкая видимость %d м — ограничение на работы", data.getVisibility()));
        }

        return warnings;
    }

    private WeatherData fetchFromExternalApi(WeatherConfig config, double latitude, double longitude, UUID projectId) {
        log.info("Вызов внешнего API {} для координат ({}, {})",
                config.getApiProvider().getDisplayName(), latitude, longitude);

        try {
            return switch (config.getApiProvider()) {
                case OPENWEATHERMAP -> fetchFromOpenWeatherMap(config, latitude, longitude, projectId);
                case WEATHERAPI -> fetchFromWeatherApi(config, latitude, longitude, projectId);
                case YANDEX_WEATHER -> fetchFromYandexWeather(config, latitude, longitude, projectId);
            };
        } catch (Exception e) {
            log.error("Ошибка вызова {} API: {}, используем демо-данные",
                    config.getApiProvider().getDisplayName(), e.getMessage());
            return generateMockWeatherData(latitude, longitude, projectId);
        }
    }

    /**
     * OpenWeatherMap API: https://api.openweathermap.org/data/2.5/weather?lat=...&lon=...&appid=...&units=metric&lang=ru
     */
    private WeatherData fetchFromOpenWeatherMap(WeatherConfig config, double latitude, double longitude, UUID projectId) throws Exception {
        String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric&lang=ru",
                latitude, longitude, config.getApiKey());

        String responseBody = restTemplate.getForObject(url, String.class);
        JsonNode root = objectMapper.readTree(responseBody);

        JsonNode main = root.path("main");
        JsonNode wind = root.path("wind");
        JsonNode weather = root.path("weather").path(0);
        JsonNode clouds = root.path("clouds");

        return WeatherData.builder()
                .projectId(projectId)
                .locationName(root.path("name").asText(""))
                .latitude(latitude)
                .longitude(longitude)
                .temperature(main.path("temp").asDouble())
                .feelsLike(main.path("feels_like").asDouble())
                .humidity(main.path("humidity").asInt())
                .pressure(main.path("pressure").asInt())
                .windSpeed(wind.path("speed").asDouble())
                .windDirection(windDegreesToDirection(wind.path("deg").asInt()))
                .windGust(wind.has("gust") ? wind.path("gust").asDouble() : null)
                .weatherCondition(weather.path("main").asText(""))
                .weatherDescription(weather.path("description").asText(""))
                .cloudiness(clouds.path("all").asInt())
                .visibility(root.has("visibility") ? root.path("visibility").asInt() : null)
                .fetchedAt(Instant.now())
                .apiProvider(WeatherApiProvider.OPENWEATHERMAP)
                .build();
    }

    /**
     * WeatherAPI.com: https://api.weatherapi.com/v1/current.json?key=...&q=lat,lon&lang=ru
     */
    private WeatherData fetchFromWeatherApi(WeatherConfig config, double latitude, double longitude, UUID projectId) throws Exception {
        String url = String.format(
                "https://api.weatherapi.com/v1/current.json?key=%s&q=%s,%s&lang=ru",
                config.getApiKey(), latitude, longitude);

        String responseBody = restTemplate.getForObject(url, String.class);
        JsonNode root = objectMapper.readTree(responseBody);

        JsonNode location = root.path("location");
        JsonNode current = root.path("current");
        JsonNode condition = current.path("condition");

        return WeatherData.builder()
                .projectId(projectId)
                .locationName(location.path("name").asText(""))
                .latitude(latitude)
                .longitude(longitude)
                .temperature(current.path("temp_c").asDouble())
                .feelsLike(current.path("feelslike_c").asDouble())
                .humidity(current.path("humidity").asInt())
                .pressure((int) (current.path("pressure_mb").asDouble()))
                .windSpeed(current.path("wind_kph").asDouble() / 3.6) // km/h to m/s
                .windDirection(current.path("wind_dir").asText(""))
                .windGust(current.has("gust_kph") ? current.path("gust_kph").asDouble() / 3.6 : null)
                .weatherCondition(condition.path("text").asText(""))
                .weatherDescription(condition.path("text").asText(""))
                .cloudiness(current.path("cloud").asInt())
                .visibility(current.has("vis_km") ? (int) (current.path("vis_km").asDouble() * 1000) : null)
                .fetchedAt(Instant.now())
                .apiProvider(WeatherApiProvider.WEATHERAPI)
                .build();
    }

    /**
     * Яндекс.Погода: https://api.weather.yandex.ru/v2/forecast?lat=...&lon=...&lang=ru_RU
     */
    private WeatherData fetchFromYandexWeather(WeatherConfig config, double latitude, double longitude, UUID projectId) throws Exception {
        String url = String.format(
                "https://api.weather.yandex.ru/v2/forecast?lat=%s&lon=%s&lang=ru_RU&limit=1",
                latitude, longitude);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("X-Yandex-Weather-Key", config.getApiKey());
        org.springframework.http.HttpEntity<Void> request = new org.springframework.http.HttpEntity<>(headers);

        org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, request, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode fact = root.path("fact");
        JsonNode info = root.path("info");

        return WeatherData.builder()
                .projectId(projectId)
                .locationName(info.path("url").asText(""))
                .latitude(latitude)
                .longitude(longitude)
                .temperature(fact.path("temp").asDouble())
                .feelsLike(fact.path("feels_like").asDouble())
                .humidity(fact.path("humidity").asInt())
                .pressure(fact.path("pressure_mm").asInt())
                .windSpeed(fact.path("wind_speed").asDouble())
                .windDirection(fact.path("wind_dir").asText(""))
                .windGust(fact.has("wind_gust") ? fact.path("wind_gust").asDouble() : null)
                .weatherCondition(fact.path("condition").asText(""))
                .weatherDescription(fact.path("condition").asText(""))
                .cloudiness((int) (fact.path("cloudness").asDouble() * 100))
                .visibility(null)
                .fetchedAt(Instant.now())
                .apiProvider(WeatherApiProvider.YANDEX_WEATHER)
                .build();
    }

    private String windDegreesToDirection(int degrees) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        return directions[(int) Math.round(((double) degrees % 360) / 45) % 8];
    }

    private WeatherData generateMockWeatherData(double latitude, double longitude, UUID projectId) {
        Random random = new Random();

        String[] conditions = {"Clear", "Clouds", "Rain", "Snow", "Drizzle", "Mist"};
        String[] windDirections = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};

        String condition = conditions[random.nextInt(conditions.length)];
        double temperature = -10 + random.nextDouble() * 40; // -10 to +30
        double windSpeed = random.nextDouble() * 15; // 0 to 15 m/s

        return WeatherData.builder()
                .projectId(projectId)
                .locationName("Москва (демо)")
                .latitude(latitude)
                .longitude(longitude)
                .temperature(Math.round(temperature * 10.0) / 10.0)
                .feelsLike(Math.round((temperature - 2 - random.nextDouble() * 3) * 10.0) / 10.0)
                .humidity(30 + random.nextInt(60))
                .windSpeed(Math.round(windSpeed * 10.0) / 10.0)
                .windDirection(windDirections[random.nextInt(windDirections.length)])
                .weatherCondition(condition)
                .weatherDescription(getDescriptionForCondition(condition))
                .pressure(730.0 + random.nextDouble() * 40)
                .visibility(1000 + random.nextInt(9000))
                .isSafeForWork(true)
                .fetchedAt(Instant.now())
                .build();
    }

    private String getDescriptionForCondition(String condition) {
        return switch (condition) {
            case "Clear" -> "Ясно";
            case "Clouds" -> "Облачно";
            case "Rain" -> "Дождь";
            case "Snow" -> "Снег";
            case "Drizzle" -> "Морось";
            case "Mist" -> "Туман";
            case "Thunderstorm" -> "Гроза";
            default -> condition;
        };
    }
}
