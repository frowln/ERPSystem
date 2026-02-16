package com.privod.platform.modules.integration.weather.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.weather.service.WeatherService;
import com.privod.platform.modules.integration.weather.web.dto.UpdateWeatherConfigRequest;
import com.privod.platform.modules.integration.weather.web.dto.WeatherConfigResponse;
import com.privod.platform.modules.integration.weather.web.dto.WeatherDataResponse;
import com.privod.platform.modules.integration.weather.web.dto.WeatherSafetyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/weather")
@RequiredArgsConstructor
@Tag(name = "Weather Integration", description = "Интеграция с погодными API")
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить конфигурацию погодного API")
    public ResponseEntity<ApiResponse<WeatherConfigResponse>> getConfig() {
        WeatherConfigResponse config = weatherService.getConfig();
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию погодного API")
    public ResponseEntity<ApiResponse<WeatherConfigResponse>> updateConfig(
            @Valid @RequestBody UpdateWeatherConfigRequest request) {
        WeatherConfigResponse config = weatherService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Получить текущую погоду для проекта")
    public ResponseEntity<ApiResponse<WeatherDataResponse>> getCurrentWeather(
            @RequestParam UUID projectId) {
        WeatherDataResponse weather = weatherService.fetchWeatherForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(weather));
    }

    @GetMapping("/forecast")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Получить прогноз погоды для проекта")
    public ResponseEntity<ApiResponse<List<WeatherDataResponse>>> getForecast(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "5") int days) {
        List<WeatherDataResponse> forecast = weatherService.getForecast(projectId, days);
        return ResponseEntity.ok(ApiResponse.ok(forecast));
    }

    @GetMapping("/safety-assessment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'SAFETY_OFFICER')")
    @Operation(summary = "Оценка безопасности погодных условий для работ")
    public ResponseEntity<ApiResponse<WeatherSafetyResponse>> getSafetyAssessment(
            @RequestParam UUID projectId) {
        WeatherSafetyResponse safety = weatherService.assessSafety(projectId);
        return ResponseEntity.ok(ApiResponse.ok(safety));
    }
}
