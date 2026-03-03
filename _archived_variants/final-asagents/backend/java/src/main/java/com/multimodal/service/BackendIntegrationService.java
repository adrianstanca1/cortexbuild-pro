package com.multimodal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Backend Integration Service
 * Provides communication with Node.js backend and cross-backend functionality
 */
@Service
@Slf4j
public class BackendIntegrationService {

    @Value("${nodejs.backend.url:http://localhost:5001}")
    private String nodejsBackendUrl;

    @Value("${nodejs.backend.enabled:true}")
    private boolean nodejsBackendEnabled;

    private final RestTemplate restTemplate;
    private final Map<String, CircuitBreaker> circuitBreakers = new ConcurrentHashMap<>();

    private static final int MAX_FAILURES = 5;
    private static final long CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
    private static final long CIRCUIT_BREAKER_RESET_TIMEOUT = 300000; // 5 minutes

    public BackendIntegrationService() {
        this.restTemplate = new RestTemplate();
        initializeCircuitBreaker();
    }

    private void initializeCircuitBreaker() {
        circuitBreakers.put("nodejs", new CircuitBreaker());
    }

    /**
     * Check if Node.js backend is available
     */
    public boolean isNodeJsAvailable() {
        if (!nodejsBackendEnabled) {
            return false;
        }

        CircuitBreaker breaker = circuitBreakers.get("nodejs");
        return breaker != null && breaker.canMakeRequest();
    }

    /**
     * Forward request to Node.js backend
     */
    public <T> ResponseEntity<T> forwardToNodeJs(
            String path,
            HttpMethod method,
            Object body,
            Class<T> responseType) {
        CircuitBreaker breaker = circuitBreakers.get("nodejs");

        if (breaker == null || !breaker.canMakeRequest()) {
            log.warn("Node.js backend unavailable - circuit breaker open");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        String url = nodejsBackendUrl + path;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<?> requestEntity = new HttpEntity<>(body, headers);

            log.debug("Forwarding to Node.js: {} {}", method, url);
            ResponseEntity<T> response = restTemplate.exchange(url, method, requestEntity, responseType);

            breaker.recordSuccess();
            return response;

        } catch (RestClientException e) {
            breaker.recordFailure();
            log.error("Failed to forward request to Node.js backend: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get data from Node.js backend
     */
    public <T> T getFromNodeJs(String path, Class<T> responseType) {
        ResponseEntity<T> response = forwardToNodeJs(path, HttpMethod.GET, null, responseType);
        return response.getBody();
    }

    /**
     * Post data to Node.js backend
     */
    public <T> T postToNodeJs(String path, Object body, Class<T> responseType) {
        ResponseEntity<T> response = forwardToNodeJs(path, HttpMethod.POST, body, responseType);
        return response.getBody();
    }

    /**
     * Check health of Node.js backend
     */
    public Map<String, Object> checkNodeJsHealth() {
        Map<String, Object> health = new HashMap<>();

        if (!isNodeJsAvailable()) {
            health.put("status", "unavailable");
            health.put("error", "Circuit breaker open");
            return health;
        }

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) forwardToNodeJs(
                    "/api/system/health",
                    HttpMethod.GET,
                    null,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                health.put("status", "healthy");
                health.put("details", response.getBody());
            } else {
                health.put("status", "unhealthy");
                health.put("statusCode", response.getStatusCode().value());
            }

        } catch (Exception e) {
            health.put("status", "unhealthy");
            health.put("error", e.getMessage());
        }

        return health;
    }

    /**
     * Aggregate data from both backends (Java + Node.js)
     */
    public Map<String, Object> aggregateBackendData(String nodePath, Object javaData) {
        Map<String, Object> aggregated = new HashMap<>();
        aggregated.put("java", javaData);

        if (isNodeJsAvailable()) {
            try {
                Object nodeData = getFromNodeJs(nodePath, Object.class);
                aggregated.put("node", nodeData);
                aggregated.put("mode", "dual-backend");
            } catch (Exception e) {
                log.warn("Failed to get Node.js data for aggregation: {}", e.getMessage());
                aggregated.put("node", null);
                aggregated.put("mode", "java-only");
                aggregated.put("nodeError", e.getMessage());
            }
        } else {
            aggregated.put("node", null);
            aggregated.put("mode", "java-only");
        }

        return aggregated;
    }

    /**
     * Synchronize data between backends
     */
    public boolean synchronizeData(String path, Object data) {
        if (!isNodeJsAvailable()) {
            log.warn("Cannot synchronize - Node.js backend unavailable");
            return false;
        }

        try {
            ResponseEntity<?> response = forwardToNodeJs(path, HttpMethod.POST, data, Object.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to synchronize data: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get capabilities from Node.js backend
     */
    public Map<String, Object> getNodeJsCapabilities() {
        Map<String, Object> capabilities = new HashMap<>();

        if (!isNodeJsAvailable()) {
            capabilities.put("available", false);
            capabilities.put("error", "Backend unavailable");
            return capabilities;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) getFromNodeJs("/api/system/health", Map.class);
            capabilities.put("available", true);
            capabilities.put("capabilities", response);
        } catch (Exception e) {
            capabilities.put("available", false);
            capabilities.put("error", e.getMessage());
        }

        return capabilities;
    }

    /**
     * Reset circuit breaker
     */
    public void resetCircuitBreaker() {
        CircuitBreaker breaker = circuitBreakers.get("nodejs");
        if (breaker != null) {
            breaker.reset();
            log.info("Circuit breaker reset for Node.js backend");
        }
    }

    /**
     * Get circuit breaker status
     */
    public Map<String, Object> getCircuitBreakerStatus() {
        CircuitBreaker breaker = circuitBreakers.get("nodejs");
        Map<String, Object> status = new HashMap<>();

        if (breaker != null) {
            status.put("state", breaker.getState());
            status.put("failures", breaker.getFailureCount());
            status.put("canMakeRequest", breaker.canMakeRequest());
        }

        return status;
    }

    /**
     * Inner class for Circuit Breaker pattern
     */
    private static class CircuitBreaker {
        private int failures = 0;
        private long lastFailureTime = 0;
        private State state = State.CLOSED;

        enum State {
            CLOSED, OPEN, HALF_OPEN
        }

        public boolean canMakeRequest() {
            if (state == State.CLOSED) {
                return true;
            }

            if (state == State.OPEN) {
                long timeSinceFailure = System.currentTimeMillis() - lastFailureTime;
                if (timeSinceFailure > CIRCUIT_BREAKER_TIMEOUT) {
                    state = State.HALF_OPEN;
                    return true;
                }
                return false;
            }

            return true; // HALF_OPEN allows requests
        }

        public void recordSuccess() {
            if (state == State.HALF_OPEN) {
                state = State.CLOSED;
                failures = 0;
                log.info("Circuit breaker closed after successful request");
            }
        }

        public void recordFailure() {
            failures++;
            lastFailureTime = System.currentTimeMillis();

            if (failures >= MAX_FAILURES) {
                state = State.OPEN;
                log.warn("Circuit breaker opened after {} failures", failures);

                // Auto-reset after timeout
                new Thread(() -> {
                    try {
                        Thread.sleep(CIRCUIT_BREAKER_RESET_TIMEOUT);
                        state = State.HALF_OPEN;
                        failures = 0;
                        log.info("Circuit breaker moved to half-open state");
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
            }
        }

        public void reset() {
            state = State.CLOSED;
            failures = 0;
            lastFailureTime = 0;
        }

        public State getState() {
            return state;
        }

        public int getFailureCount() {
            return failures;
        }
    }
}
