# Incident Runbooks
## Production Incident Response Procedures

---

## Table of Contents
1. [High Error Rate](#high-error-rate)
2. [High Latency](#high-latency)
3. [Database Down](#database-down)
4. [Low Disk Space](#low-disk-space)
5. [High Memory Usage](#high-memory-usage)
6. [SSL Certificate Expiry](#ssl-certificate-expiry)
7. [Service Down](#service-down)
8. [Redis Down](#redis-down)
9. [Cache Performance Degradation](#cache-performance-degradation)
10. [Queue Backup](#queue-backup)

---

## High Error Rate

**Alert:** `HighErrorRate`  
**Severity:** Critical  
**Threshold:** Error rate > 5% for 5 minutes

### Symptoms
- Increased 5xx responses
- User complaints about failures
- Dashboard showing elevated error rates

### Immediate Actions
1. **Acknowledge the alert** in PagerDuty
2. **Check Grafana dashboard** for error breakdown by endpoint
3. **Review recent deployments** - check if error spike correlates with deploy
4. **Check application logs** for stack traces

### Investigation Steps
```bash
# Check error logs
kubectl logs -l app=cortexbuild --tail=1000 | grep -i error

# Check recent deployments
kubectl get events --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods -l app=cortexbuild
```

### Common Causes
- Database connection issues
- External API failures
- Memory pressure causing OOM
- Configuration changes

### Resolution
1. If deployment-related: **Roll back** immediately
   ```bash
   kubectl rollout undo deployment/cortexbuild
   ```
2. If database: Check connection pool, restart if needed
3. If external API: Enable circuit breaker, degrade gracefully

### Escalation
- Engage backend team if not resolved in 15 minutes
- Engage SRE if customer impact > 5 minutes

---

## High Latency

**Alert:** `HighLatency`  
**Severity:** Warning  
**Threshold:** p99 latency > 2s for 5 minutes

### Symptoms
- Slow page loads
- API timeouts
- User experience degradation

### Immediate Actions
1. **Check Grafana latency dashboard**
2. **Identify slow endpoints**
3. **Check database query performance**

### Investigation Steps
```bash
# Check slow queries
kubectl exec -it postgres-pod -- psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# Check application metrics
curl http://cortexbuild-api:3001/api/metrics | grep duration

# Check resource pressure
kubectl top pods -l app=cortexbuild
```

### Common Causes
- Database lock contention
- Missing indexes
- Memory pressure
- Network issues
- External API slowdowns

### Resolution
1. **Database:** Kill long-running queries, add indexes
2. **Application:** Scale horizontally
   ```bash
   kubectl scale deployment/cortexbuild --replicas=5
   ```
3. **Cache:** Increase cache hit rate

### Escalation
- Engage database team if DB-related
- Engage SRE if p99 > 5s

---

## Database Down

**Alert:** `DatabaseDown`  
**Severity:** Critical  
**Threshold:** Database unreachable for 1 minute

### Symptoms
- All API calls failing
- 503 errors across the platform
- Complete service outage

### Immediate Actions
1. **Declare incident** - page on-call DBA and SRE
2. **Check database status**
3. **Enable maintenance mode** if available

### Investigation Steps
```bash
# Check PostgreSQL status
kubectl exec -it postgres-pod -- pg_isready

# Check logs
kubectl logs postgres-pod

# Check connections
kubectl exec -it postgres-pod -- psql -c "SELECT count(*) FROM pg_stat_activity"
```

### Common Causes
- OOM kill
- Disk full
- Configuration error
- Network partition
- Storage failure

### Resolution
1. **Restart database** if safe:
   ```bash
   kubectl rollout restart statefulset/postgres
   ```
2. **Failover to replica** if primary unrecoverable
3. **Restore from backup** if data corruption

### Escalation
- **Immediate** escalation to DBA team
- **Executive notification** if outage > 5 minutes

### Post-Incident
- Root cause analysis required
- Review backup strategy
- Update runbook if new cause discovered

---

## Low Disk Space

**Alert:** `LowDiskSpace` / `CriticalLowDiskSpace`  
**Severity:** Warning / Critical  
**Threshold:** < 20% / < 10% available

### Symptoms
- Write operations failing
- Database performance degradation
- Log rotation failures

### Immediate Actions
1. **Identify disk usage**
2. **Clean up old files**
3. **Expand storage** if needed

### Investigation Steps
```bash
# Check disk usage
kubectl exec -it node-pod -- df -h

# Find large files
kubectl exec -it node-pod -- du -ah /var | sort -rh | head -20

# Check log sizes
kubectl exec -it node-pod -- du -sh /var/log/*
```

### Common Causes
- Log accumulation
- Old container images
- Database bloat
- Temporary files

### Resolution
1. **Clean logs:**
   ```bash
   kubectl exec -it node-pod -- find /var/log -name "*.log" -mtime +7 -delete
   ```
2. **Prune images:**
   ```bash
   docker image prune -af
   ```
3. **Vacuum database:**
   ```bash
   kubectl exec -it postgres-pod -- vacuumdb --all --verbose
   ```
4. **Expand PV:**
   ```bash
   kubectl edit pvc data-postgres-0
   ```

### Escalation
- Engage infrastructure team if expansion needed

---

## High Memory Usage

**Alert:** `HighMemoryUsage` / `CriticalHighMemoryUsage`  
**Severity:** Warning / Critical  
**Threshold:** > 90% / > 95%

### Symptoms
- Slow responses
- OOM kills
- Application restarts

### Immediate Actions
1. **Check memory consumers**
2. **Scale horizontally**
3. **Restart memory-leaking pods**

### Investigation Steps
```bash
# Check pod memory
kubectl top pods --sort-by=memory

# Check node memory
kubectl top nodes

# Describe OOM events
kubectl get events --field-selector reason=OOMKilling
```

### Common Causes
- Memory leak
- Insufficient resources
- Traffic spike
- Cache bloat

### Resolution
1. **Restart leaking pods:**
   ```bash
   kubectl rollout restart deployment/cortexbuild
   ```
2. **Scale horizontally:**
   ```bash
   kubectl scale deployment/cortexbuild --replicas=10
   ```
3. **Increase memory limits:**
   ```bash
   kubectl set resources deployment/cortexbuild --limits=memory=2Gi
   ```

### Escalation
- Engage development team if memory leak suspected

---

## SSL Certificate Expiry

**Alert:** `SSLCertExpirySoon` / `SSLCertExpiryCritical`  
**Severity:** Warning / Critical  
**Threshold:** < 30 days / < 7 days

### Symptoms
- Certificate expiry warnings
- Browser security warnings
- HTTPS failures

### Immediate Actions
1. **Check certificate status**
2. **Initiate renewal**
3. **Update load balancer**

### Investigation Steps
```bash
# Check certificate
openssl s_client -connect api.cortexbuild.com:443 | openssl x509 -noout -dates

# Check cert-manager
kubectl get certificates -A
```

### Common Causes
- Auto-renewal failure
- DNS validation issues
- Certificate authority problems

### Resolution
1. **Manual renewal:**
   ```bash
   certbot renew --force-renewal
   ```
2. **Update ingress:**
   ```bash
   kubectl apply -f tls-secret.yaml
   ```
3. **Verify cert-manager:**
   ```bash
   kubectl logs -l app=cert-manager
   ```

### Escalation
- Engage security team if renewal fails

---

## Service Down

**Alert:** `ServiceDown`  
**Severity:** Critical  
**Threshold:** Service unreachable for 1 minute

### Symptoms
- 502/503 errors
- Health check failures
- Pod restarts

### Immediate Actions
1. **Check pod status**
2. **Review recent changes**
3. **Restart service**

### Investigation Steps
```bash
# Check pods
kubectl get pods -l app=cortexbuild

# Describe failing pod
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name> --tail=500
```

### Common Causes
- Crash loop
- Resource exhaustion
- Configuration error
- Dependency failure

### Resolution
1. **Rollback if recent deploy:**
   ```bash
   kubectl rollout undo deployment/cortexbuild
   ```
2. **Fix configuration:**
   ```bash
   kubectl apply -f configmap.yaml
   ```
3. **Scale up:**
   ```bash
   kubectl scale deployment/cortexbuild --replicas=3
   ```

### Escalation
- Engage on-call engineer immediately

---

## Redis Down

**Alert:** `RedisDown`  
**Severity:** Critical  
**Threshold:** Redis unreachable for 1 minute

### Symptoms
- Cache misses
- Session losses
- Performance degradation

### Immediate Actions
1. **Check Redis status**
2. **Failover to replica**
3. **Restart if needed**

### Investigation Steps
```bash
# Check Redis
kubectl exec -it redis-pod -- redis-cli ping

# Check memory
kubectl exec -it redis-pod -- redis-cli info memory

# Check persistence
kubectl exec -it redis-pod -- redis-cli info persistence
```

### Common Causes
- OOM kill
- Persistence failure
- Network issue
- Configuration change

### Resolution
1. **Restart Redis:**
   ```bash
   kubectl rollout restart statefulset/redis
   ```
2. **Failover:**
   ```bash
   redis-cli -h replica-host promote
   ```

### Escalation
- Engage database team

---

## Cache Performance Degradation

**Alert:** `LowCacheHitRate`  
**Severity:** Warning  
**Threshold:** Hit rate < 80%

### Symptoms
- Increased database load
- Higher latency
- More cache misses logged

### Immediate Actions
1. **Check cache statistics**
2. **Identify cache churn**
3. **Review eviction policy**

### Investigation Steps
```bash
# Check hit rate
kubectl exec -it redis-pod -- redis-cli info stats

# Check memory
kubectl exec -it redis-pod -- redis-cli info memory

# Check keys
kubectl exec -it redis-pod -- redis-cli dbsize
```

### Common Causes
- Memory pressure causing eviction
- Cache key changes
- Traffic pattern changes
- Cache invalidation bugs

### Resolution
1. **Increase memory:**
   ```bash
   kubectl set resources statefulset/redis --limits=memory=4Gi
   ```
2. **Review TTL settings**
3. **Fix invalidation logic**

### Escalation
- Engage backend team if code-related

---

## Queue Backup

**Alert:** `HighQueueDepth`  
**Severity:** Warning  
**Threshold:** Queue depth > 1000

### Symptoms
- Delayed processing
- Job timeouts
- User notifications delayed

### Immediate Actions
1. **Check queue status**
2. **Scale workers**
3. **Identify stuck jobs**

### Investigation Steps
```bash
# Check queue depth
kubectl exec -it redis-pod -- redis-cli llen jobs

# Check workers
kubectl get pods -l app=worker

# Check worker logs
kubectl logs -l app=worker --tail=100
```

### Common Causes
- Worker failures
- Slow job processing
- Traffic spike
- Dead letter queue

### Resolution
1. **Scale workers:**
   ```bash
   kubectl scale deployment/worker --replicas=10
   ```
2. **Restart stuck workers:**
   ```bash
   kubectl rollout restart deployment/worker
   ```
3. **Clear dead jobs:**
   ```bash
   kubectl exec -it redis-pod -- redis-cli del job:stuck
   ```

### Escalation
- Engage backend team if jobs failing

---

## Contact Information

### On-Call Escalation
- **L1:** On-call Engineer (PagerDuty)
- **L2:** Team Lead
- **L3:** Engineering Director
- **L4:** VP Engineering

### Communication Channels
- **Slack:** #incidents, #oncall
- **Status Page:** status.cortexbuild.com
- **Post-mortem:** Post-mortem template in Confluence

### Tools Access
- **Grafana:** grafana.cortexbuild.com
- **Prometheus:** prometheus.cortexbuild.com
- **Logs:** logs.cortexbuild.com (Loki)
- **Traces:** traces.cortexbuild.com (Jaeger)
