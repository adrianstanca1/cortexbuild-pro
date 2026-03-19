# Service Level Objectives (SLO)
## CortexBuild Production SLOs

---

## Overview

This document defines the Service Level Objectives (SLOs) for CortexBuild, establishing measurable targets for reliability and performance.

---

## Service Level Indicators (SLIs)

### 1. Availability

**Definition:** Percentage of successful requests (HTTP 2xx/3xx)  
**Measurement:** `http_requests_total{status=~"2..|3.."}` / `http_requests_total`

### 2. Latency

**Definition:** Request response time at p99 percentile  
**Measurement:** `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`

### 3. Quality

**Definition:** Percentage of requests without errors (HTTP 4xx/5xx excluded)  
**Measurement:** `1 - (http_errors_total / http_requests_total)`

### 4. Durability

**Definition:** Data persistence guarantee  
**Measurement:** Database backup success rate, RPO (Recovery Point Objective)

---

## SLO Targets

### Tier 1: Core API (Critical)

| Metric | Target | Error Budget |
|--------|--------|--------------|
| Availability | 99.9% | 0.1% (~43 min/month) |
| Latency (p99) | < 500ms | - |
| Quality | 99.5% | 0.5% |

**Endpoints:**
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/tasks`
- `POST /api/tasks`

### Tier 2: Standard API (Important)

| Metric | Target | Error Budget |
|--------|--------|--------------|
| Availability | 99.5% | 0.5% (~3.6 hours/month) |
| Latency (p99) | < 2s | - |
| Quality | 99% | 1% |

**Endpoints:**
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/analytics`
- `PUT /api/settings`

### Tier 3: Background Jobs (Best Effort)

| Metric | Target | Error Budget |
|--------|--------|--------------|
| Availability | 99% | 1% (~7.3 hours/month) |
| Latency | < 5s | - |
| Quality | 98% | 2% |

**Jobs:**
- Email notifications
- Report generation
- Data exports
- Batch processing

---

## Error Budget Policy

### Monthly Error Budgets

| Tier | Monthly Budget | Weekly Budget | Daily Budget |
|------|---------------|---------------|--------------|
| Tier 1 | 43 minutes | 10 minutes | 1.4 minutes |
| Tier 2 | 3.6 hours | 51 minutes | 7.3 minutes |
| Tier 3 | 7.3 hours | 103 minutes | 14.6 minutes |

### Burn Rate Thresholds

| Burn Rate | Action | Timeline |
|-----------|--------|----------|
| 1x (normal) | Monitor | Standard process |
| 2x (elevated) | Alert | Page on-call, investigate within 1 hour |
| 5x (high) | Critical | Immediate page, all hands, freeze deploys |
| 10x (critical) | Emergency | War room, stop deploys, incident response |

### Burn Rate Calculation

```
Burn Rate = (Error Rate / SLO Error Budget) 
```

Example: If Tier 1 error rate is 0.2% (budget is 0.1%):
- Burn Rate = 0.2 / 0.1 = 2x

---

## Alerting Rules

### Multi-Window Burn Rate Alerts

| Window | Burn Rate | Severity | Action |
|--------|-----------|----------|--------|
| 5m | 10x | Critical | Page immediately |
| 30m | 5x | Critical | Page immediately |
| 1h | 2x | Warning | Page on-call |
| 6h | 1x | Warning | Ticket, monitor |

### Prometheus Alert Rules

```yaml
# Tier 1 burn rate alerts
- alert: Tier1CriticalBurnRate
  expr: sum(rate(http_errors_total{tier="1"}[5m])) / sum(rate(http_requests_total{tier="1"}[5m])) > 0.01
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Tier 1 SLO burn rate critical (10x)"

- alert: Tier1HighBurnRate
  expr: sum(rate(http_errors_total{tier="1"}[30m])) / sum(rate(http_requests_total{tier="1"}[30m])) > 0.005
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Tier 1 SLO burn rate high (5x)"

- alert: Tier1ElevatedBurnRate
  expr: sum(rate(http_errors_total{tier="1"}[1h])) / sum(rate(http_requests_total{tier="1"}[1h])) > 0.002
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Tier 1 SLO burn rate elevated (2x)"

# Tier 2 burn rate alerts
- alert: Tier2CriticalBurnRate
  expr: sum(rate(http_errors_total{tier="2"}[5m])) / sum(rate(http_requests_total{tier="2"}[5m])) > 0.05
  for: 5m
  labels:
    severity: critical

# Tier 3 burn rate alerts
- alert: Tier3HighBurnRate
  expr: sum(rate(http_errors_total{tier="3"}[30m])) / sum(rate(http_requests_total{tier="3"}[30m])) > 0.025
  for: 10m
  labels:
    severity: warning
```

---

## Deployment Freeze Policy

### Automatic Freeze Triggers

1. **Error Budget Exhaustion:** When monthly budget is consumed
2. **Critical Burn Rate:** 10x burn rate for 30+ minutes
3. **Repeated Incidents:** 3+ incidents in 7 days

### Freeze Exceptions

- **P1 Security Fixes:** Always allowed
- **P1 Bug Fixes:** Requires VP Engineering approval
- **Rollbacks:** Always allowed

---

## Reporting

### Weekly SLO Reports

- Current error budget remaining
- Burn rate trends
- Top error contributors
- Incident summary

### Monthly SLO Review

- SLO achievement status
- Error budget consumption
- Trend analysis
- SLO adjustment recommendations

### Dashboard Metrics

```promql
# Availability (last 28 days)
avg_over_time(sum(rate(http_requests_total{status=~"2..|3.."}[5m])) / sum(rate(http_requests_total[5m]))[28d:5m]) * 100

# Latency p99 (last 28 days)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[28d]))

# Error budget remaining
(0.001 - sum(rate(http_errors_total[28d])) / sum(rate(http_requests_total[28d]))) / 0.001 * 100
```

---

## On-Call Readiness

### Escalation Matrix

| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| P0 (Critical) | 5 minutes | On-call → Tech Lead → VP Eng |
| P1 (High) | 15 minutes | On-call → Tech Lead |
| P2 (Medium) | 1 hour | On-call |
| P3 (Low) | Next business day | Ticket queue |

### On-Call Requirements

1. **PagerDuty:** Primary on-call rotation
2. **Runbooks:** All alerts linked to runbooks
3. **Access:** Grafana, logs, traces, k8s dashboard
4. **Communication:** #oncall Slack channel

### Incident Response SLA

| Severity | Acknowledge | Investigate | Resolve | Post-mortem |
|----------|-------------|-------------|---------|-------------|
| P0 | 5 min | 15 min | 1 hour | Required |
| P1 | 15 min | 30 min | 4 hours | Required |
| P2 | 1 hour | 2 hours | 24 hours | Optional |
| P3 | 24 hours | 48 hours | 1 week | Not required |

---

## SLO Governance

### Review Cadence

- **Weekly:** Error budget review
- **Monthly:** SLO performance review
- **Quarterly:** SLO target adjustment
- **Annually:** SLO framework review

### Stakeholders

- **Engineering:** Owns SLO achievement
- **Product:** Defines tier classifications
- **SRE:** Maintains monitoring/alerting
- **Support:** Provides user impact data

### Change Management

SLO changes require:
1. RFC document
2. Team review (7 days)
3. VP Engineering approval
4. 30-day notice for target reductions
