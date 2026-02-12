#!/bin/bash
echo "=========================================="
echo "Production Verification Script"
echo "=========================================="

FRONTEND_URL="${FRONTEND_URL:-https://cortexbuildpro.com}"
API_BASE_URL="${API_BASE_URL:-https://api.cortexbuildpro.com}"
API_HEALTH_URL="${API_HEALTH_URL:-${API_BASE_URL}/api/health}"
LEGACY_API_HEALTH_URL="${LEGACY_API_HEALTH_URL:-${FRONTEND_URL}/api/health}"

fetch_url() {
    local url="$1"
    local response
    response=$(curl -sS -w "\n%{http_code}" "${url}")
    local curl_status=$?
    if [ "${curl_status}" -ne 0 ]; then
        echo "${response}"
        return "${curl_status}"
    fi
    echo "${response}"
}

print_http_status() {
    local label="$1"
    local http_code="$2"
    local body="$3"

    if echo "${http_code}" | grep -q "^2"; then
        echo "✅ ${label} is Online (HTTP ${http_code})"
        return 0
    fi

    echo "❌ ${label} returned HTTP ${http_code}"
    if [ -n "${body}" ]; then
        echo "Response: ${body}"
    fi
    return 1
}

echo "Checking Frontend (${FRONTEND_URL})..."
FRONTEND_RESPONSE=$(fetch_url "${FRONTEND_URL}")
FRONTEND_STATUS=$?
if [ "${FRONTEND_STATUS}" -ne 0 ]; then
    echo "❌ Frontend unreachable (curl exit: ${FRONTEND_STATUS})"
else
    FRONTEND_BODY=$(echo "${FRONTEND_RESPONSE}" | sed '$d')
    FRONTEND_HTTP_CODE=$(echo "${FRONTEND_RESPONSE}" | tail -n 1)
    print_http_status "Frontend" "${FRONTEND_HTTP_CODE}" "${FRONTEND_BODY}"
fi

echo ""
echo "Checking Backend (${API_HEALTH_URL})..."
HEALTH_RESPONSE=$(fetch_url "${API_HEALTH_URL}")
HEALTH_STATUS=$?
HEALTH_BODY=$(echo "${HEALTH_RESPONSE}" | sed '$d')
HEALTH_HTTP_CODE=$(echo "${HEALTH_RESPONSE}" | tail -n 1)

if [ "${HEALTH_STATUS}" -ne 0 ]; then
    echo "❌ Backend unreachable (curl exit: ${HEALTH_STATUS})"
elif echo "${HEALTH_BODY}" | grep -q "online"; then
    echo "✅ Backend is Online!"
    echo "Response: ${HEALTH_BODY}"
else
    echo "❌ Backend is Offline / Stopped"
    print_http_status "Backend" "${HEALTH_HTTP_CODE}" "${HEALTH_BODY}"
fi
echo ""
echo "Checking Legacy Backend (${LEGACY_API_HEALTH_URL})..."
LEGACY_RESPONSE=$(fetch_url "${LEGACY_API_HEALTH_URL}")
LEGACY_STATUS=$?
LEGACY_BODY=$(echo "${LEGACY_RESPONSE}" | sed '$d')
LEGACY_HTTP_CODE=$(echo "${LEGACY_RESPONSE}" | tail -n 1)
if [ "${LEGACY_STATUS}" -ne 0 ]; then
    echo "❌ Legacy Backend unreachable (curl exit: ${LEGACY_STATUS})"
elif echo "${LEGACY_BODY}" | grep -q "online"; then
    echo "✅ Legacy Backend is Online!"
    echo "Response: ${LEGACY_BODY}"
else
    echo "❌ Legacy Backend is Offline / Stopped"
    print_http_status "Legacy Backend" "${LEGACY_HTTP_CODE}" "${LEGACY_BODY}"
fi
echo ""
echo "Diagnosis:"
echo "If you see '503 Service Unavailable', the app is STOPPED in hPanel."
echo "=========================================="
