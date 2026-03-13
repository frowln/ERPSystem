package com.privod.platform.modules.ai.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URI;

/**
 * Transparent proxy for OpenAI-compatible Chat Completions API.
 * Keeps the API key server-side so it never reaches the browser.
 * Supports both regular and streaming (SSE) responses.
 *
 * Configuration:
 *   app.ai.api-key       - API key for the AI provider
 *   app.ai.base-url      - Base URL (default: https://api.openai.com/v1)
 *   app.ai.proxy-host    - Optional HTTP proxy host (for geo-restricted regions)
 *   app.ai.proxy-port    - Optional HTTP proxy port
 */
@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Chat Proxy", description = "Proxy for OpenAI-compatible chat completions")
@Slf4j
public class AiChatProxyController {

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${app.ai.proxy-host:}")
    private String proxyHost;

    @Value("${app.ai.proxy-port:0}")
    private int proxyPort;

    @PostMapping("/chat/completions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Proxy chat completion request to AI provider")
    public void proxyChatCompletions(@RequestBody byte[] body, HttpServletResponse response) throws IOException {
        if (apiKey == null || apiKey.isBlank()) {
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":{\"message\":\"AI API key is not configured on the server\"}}");
            return;
        }

        String url = baseUrl.replaceAll("/+$", "") + "/chat/completions";
        HttpURLConnection conn = null;
        try {
            if (proxyHost != null && !proxyHost.isBlank() && proxyPort > 0) {
                Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost, proxyPort));
                conn = (HttpURLConnection) URI.create(url).toURL().openConnection(proxy);
            } else {
                conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            }
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setDoOutput(true);
            conn.setConnectTimeout(15_000);
            conn.setReadTimeout(120_000);

            try (OutputStream out = conn.getOutputStream()) {
                out.write(body);
                out.flush();
            }

            int status = conn.getResponseCode();
            response.setStatus(status);

            String contentType = conn.getContentType();
            if (contentType != null) {
                response.setContentType(contentType);
            }

            InputStream in = status < 400 ? conn.getInputStream() : conn.getErrorStream();
            if (in != null) {
                try (InputStream is = in; OutputStream os = response.getOutputStream()) {
                    byte[] buffer = new byte[4096];
                    int n;
                    while ((n = is.read(buffer)) != -1) {
                        os.write(buffer, 0, n);
                        os.flush();
                    }
                }
            }
        } catch (IOException e) {
            log.error("AI proxy error: {}", e.getMessage());
            if (!response.isCommitted()) {
                response.setStatus(HttpStatus.BAD_GATEWAY.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":{\"message\":\"Failed to reach AI service: " +
                        e.getMessage().replace("\"", "'") + "\"}}");
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
