-- ═══════════════════════════════════════════════════════════════════════════
-- Stored Procedures for CortexBuild Platform
-- Version: 3.0.0
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROJECT COST AGGREGATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_project_costs(project_id_param UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'project_id', p.id,
        'project_name', p.name,
        'original_budget', COALESCE(orig.total, 0),
        'revised_budget', COALESCE(rev.total, 0),
        'actual_cost', COALESCE(actual.total, 0),
        'committed_cost', COALESCE(committed.total, 0),
        'forecast_cost', COALESCE(forecast.total, 0),
        'estimated_total', COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0),
        'budget_variance', COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)),
        'variance_percent', CASE WHEN COALESCE(rev.total, 0) > 0 
            THEN ROUND(((COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0))) / COALESCE(rev.total, 0) * 100)::numeric, 2)
            ELSE 0 END,
        'burn_rate', CASE WHEN COALESCE(rev.total, 0) > 0 
            THEN ROUND((COALESCE(actual.total, 0) / COALESCE(rev.total, 0) * 100)::numeric, 2)
            ELSE 0 END,
        'cpi', CASE WHEN COALESCE(actual.total, 0) > 0 
            THEN ROUND((COALESCE(orig.total, 0) / COALESCE(actual.total, 0))::numeric, 4)
            ELSE 1 END,
        'status', CASE 
            WHEN COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)) > 0 THEN 'under_budget'
            WHEN COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)) < -COALESCE(rev.total, 0) * 0.1 THEN 'over_budget_critical'
            ELSE 'over_budget'
        END
    ) INTO result
    FROM projects p
    LEFT JOIN (
        SELECT SUM(original_amount) as total 
        FROM budget_line_items 
        WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = 1)
    ) orig ON true
    LEFT JOIN (
        SELECT SUM(revised_amount) as total 
        FROM budget_line_items 
        WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) rev ON true
    LEFT JOIN (
        SELECT SUM(actual_amount) as total 
        FROM budget_line_items 
        WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) actual ON true
    LEFT JOIN (
        SELECT SUM(total) as total 
        FROM purchase_order_items 
        WHERE po_id IN (SELECT id FROM purchase_orders WHERE project_id = project_id_param AND status IN ('approved', 'sent'))
    ) committed ON true
    LEFT JOIN (
        SELECT SUM(forecast_amount) as total 
        FROM budget_line_items 
        WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) forecast ON true
    WHERE p.id = project_id_param;
    
    RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CRITICAL PATH CALCULATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_critical_path(project_id_param UUID) 
RETURNS TABLE(
    task_id UUID, 
    task_name TEXT,
    is_critical BOOLEAN, 
    early_start DATE, 
    early_end DATE, 
    late_start DATE, 
    late_end DATE, 
    total_float INTEGER,
    free_float INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE task_chain AS (
        -- Base case: tasks with no predecessors
        SELECT 
            t.id,
            t.title,
            t.due_date as early_end,
            t.due_date - COALESCE(t.estimated_hours, 8) / 8 as early_start,
            t.due_date as late_end,
            t.due_date - COALESCE(t.estimated_hours, 8) / 8 as late_start,
            0 as total_float,
            0 as free_float,
            ARRAY[t.id] as path
        FROM tasks t
        WHERE t.project_id = project_id_param
        AND NOT EXISTS (SELECT 1 FROM task_dependencies td WHERE td.task_id = t.id)
        
        UNION ALL
        
        -- Recursive case: tasks with predecessors
        SELECT 
            t.id,
            t.title,
            GREATEST(tc.early_end, t.due_date - COALESCE(t.estimated_hours, 8) / 8) as early_end,
            GREATEST(tc.early_end, t.due_date - COALESCE(t.estimated_hours, 8) / 8) - COALESCE(t.estimated_hours, 8) / 8 as early_start,
            LEAST(tc.late_end, t.due_date) as late_end,
            LEAST(tc.late_end, t.due_date) - COALESCE(t.estimated_hours, 8) / 8 as late_start,
            ABS(tc.late_end - tc.early_end) as total_float,
            ABS(t.due_date - tc.early_end) as free_float,
            tc.path || t.id as path
        FROM tasks t
        JOIN task_dependencies td ON td.task_id = t.id
        JOIN task_chain tc ON tc.id = td.predecessor_task_id
        WHERE t.project_id = project_id_param
    )
    SELECT 
        id as task_id,
        title as task_name,
        total_float <= 1 as is_critical,
        early_start,
        early_end,
        late_start,
        late_end,
        total_float,
        free_float
    FROM task_chain
    ORDER BY early_start;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RESOURCE LEVELING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION level_resources(project_id_param UUID) 
RETURNS TABLE(
    resource_id UUID,
    resource_name TEXT,
    resource_role TEXT,
    overallocated BOOLEAN,
    allocation_hours DECIMAL,
    allocation_percent DECIMAL,
    assigned_tasks INTEGER,
    recommended_action TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as resource_id,
        u.name as resource_name,
        u.role as resource_role,
        CASE WHEN COALESCE(total_hours.total, 0) > 40 THEN TRUE ELSE FALSE END as overallocated,
        COALESCE(total_hours.total, 0) as allocation_hours,
        ROUND((COALESCE(total_hours.total, 0) / 40.0 * 100)::numeric, 2) as allocation_percent,
        COALESCE(task_count.cnt, 0) as assigned_tasks,
        CASE 
            WHEN COALESCE(total_hours.total, 0) > 60 THEN 'reassign_tasks'
            WHEN COALESCE(total_hours.total, 0) > 40 THEN 'reduce_workload'
            WHEN COALESCE(total_hours.total, 0) < 20 THEN 'increase_utilization'
            ELSE 'optimal'
        END as recommended_action
    FROM users u
    LEFT JOIN (
        SELECT assigned_to, SUM(estimated_hours) as total
        FROM tasks
        WHERE project_id = project_id_param 
        AND status IN ('not_started', 'in_progress', 'blocked')
        AND estimated_hours IS NOT NULL
        GROUP BY assigned_to
    ) total_hours ON total_hours.assigned_to = u.id
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as cnt
        FROM tasks
        WHERE project_id = project_id_param 
        AND status IN ('not_started', 'in_progress', 'blocked')
        GROUP BY assigned_to
    ) task_count ON task_count.assigned_to = u.id
    WHERE u.company_id = (SELECT company_id FROM projects WHERE id = project_id_param LIMIT 1)
    AND u.is_active = true
    ORDER BY allocation_hours DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. BUDGET VARIANCE ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION analyze_budget_variance(project_id_param UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSONB;
    original_budget DECIMAL(15, 2);
    revised_budget DECIMAL(15, 2);
    actual_cost DECIMAL(15, 2);
    committed_cost DECIMAL(15, 2);
    forecast_cost DECIMAL(15, 2);
    estimated_total DECIMAL(15, 2);
    variance DECIMAL(15, 2);
    variance_percent DECIMAL(5, 2);
BEGIN
    -- Get original budget
    SELECT SUM(original_amount) INTO original_budget
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = 1);
    
    -- Get revised budget
    SELECT SUM(revised_amount) INTO revised_budget
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param));
    
    -- Get actual cost
    SELECT SUM(actual_amount) INTO actual_cost
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param));
    
    -- Get committed cost
    SELECT SUM(poi.total) INTO committed_cost
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.po_id
    WHERE po.project_id = project_id_param AND po.status IN ('approved', 'sent');
    
    -- Get forecast cost
    SELECT SUM(forecast_amount) INTO forecast_cost
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param));
    
    estimated_total := actual_cost + committed_cost + forecast_cost;
    variance := revised_budget - estimated_total;
    variance_percent := CASE WHEN revised_budget > 0 THEN (variance / revised_budget * 100) ELSE 0 END;
    
    SELECT jsonb_build_object(
        'project_id', project_id_param,
        'original_budget', COALESCE(original_budget, 0),
        'revised_budget', COALESCE(revised_budget, 0),
        'actual_cost', COALESCE(actual_cost, 0),
        'committed_cost', COALESCE(committed_cost, 0),
        'forecast_cost', COALESCE(forecast_cost, 0),
        'estimated_total', COALESCE(estimated_total, 0),
        'budget_variance', COALESCE(variance, 0),
        'variance_percent', ROUND(COALESCE(variance_percent, 0)::numeric, 2),
        'cpi', CASE WHEN actual_cost > 0 THEN ROUND((original_budget / actual_cost)::numeric, 4) ELSE 1 END,
        'spi', CASE WHEN revised_budget > 0 THEN ROUND((actual_cost / revised_budget)::numeric, 4) ELSE 1 END,
        'status', CASE 
            WHEN variance > 0 THEN 'under_budget'
            WHEN variance < -revised_budget * 0.1 THEN 'over_budget_critical'
            WHEN variance < 0 THEN 'over_budget'
            ELSE 'on_budget'
        END,
        'recommendation', CASE 
            WHEN variance < -revised_budget * 0.1 THEN 'immediate_cost_review_required'
            WHEN variance < 0 THEN 'monitor_costs_closely'
            WHEN variance > revised_budget * 0.05 THEN 'consider_acceleration'
            ELSE 'continue_monitoring'
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. PROJECT HEALTH SCORE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_project_health_score(project_id_param UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    score DECIMAL(5, 2);
    schedule_score DECIMAL(5, 2);
    cost_score DECIMAL(5, 2);
    safety_score DECIMAL(5, 2);
    quality_score DECIMAL(5, 2);
    document_score DECIMAL(5, 2);
    health_status TEXT;
BEGIN
    -- Schedule score (based on task completion vs planned)
    SELECT COALESCE(
        (SELECT COUNT(*)::DECIMAL FROM tasks WHERE project_id = project_id_param AND status = 'completed') /
        NULLIF((SELECT COUNT(*)::DECIMAL FROM tasks WHERE project_id = project_id_param), 0) * 100,
        0
    ) INTO schedule_score;
    
    -- Cost score (based on budget variance)
    SELECT CASE 
        WHEN bv->>'variance_percent' IS NULL THEN 100
        WHEN (bv->>'variance_percent')::DECIMAL > 0 THEN 100
        WHEN (bv->>'variance_percent')::DECIMAL > -5 THEN 90
        WHEN (bv->>'variance_percent')::DECIMAL > -10 THEN 70
        ELSE 50
    END INTO cost_score
    FROM calculate_budget_variance(project_id_param) bv;
    
    -- Safety score (based on incidents)
    SELECT CASE 
        WHEN incident_count = 0 THEN 100
        WHEN incident_count < 3 THEN 80
        WHEN incident_count < 5 THEN 60
        ELSE 40
    END INTO safety_score
    FROM (SELECT COUNT(*) as incident_count FROM safety_incidents WHERE project_id = project_id_param AND status IN ('reported', 'under_investigation')) s;
    
    -- Quality score (based on defects)
    SELECT CASE 
        WHEN defect_count = 0 THEN 100
        WHEN defect_count < 5 THEN 85
        WHEN defect_count < 10 THEN 70
        ELSE 50
    END INTO quality_score
    FROM (SELECT COUNT(*) as defect_count FROM defects WHERE project_id = project_id_param AND status IN ('identified', 'assigned')) d;
    
    -- Document score (based on document completeness)
    SELECT CASE 
        WHEN doc_count > 50 THEN 100
        WHEN doc_count > 20 THEN 80
        WHEN doc_count > 10 THEN 60
        ELSE 40
    END INTO document_score
    FROM (SELECT COUNT(*) as doc_count FROM documents WHERE project_id = project_id_param) d;
    
    -- Calculate overall score (weighted average)
    score := (schedule_score * 0.3 + cost_score * 0.3 + safety_score * 0.2 + quality_score * 0.1 + document_score * 0.1);
    
    -- Determine health status
    health_status := CASE 
        WHEN score >= 90 THEN 'excellent'
        WHEN score >= 75 THEN 'good'
        WHEN score >= 60 THEN 'fair'
        WHEN score >= 40 THEN 'at_risk'
        ELSE 'critical'
    END;
    
    RETURN jsonb_build_object(
        'project_id', project_id_param,
        'overall_score', ROUND(score::numeric, 2),
        'health_status', health_status,
        'components', jsonb_build_object(
            'schedule_score', ROUND(schedule_score::numeric, 2),
            'cost_score', ROUND(cost_score::numeric, 2),
            'safety_score', ROUND(safety_score::numeric, 2),
            'quality_score', ROUND(quality_score::numeric, 2),
            'document_score', ROUND(document_score::numeric, 2)
        ),
        'weights', jsonb_build_object(
            'schedule', 0.3,
            'cost', 0.3,
            'safety', 0.2,
            'quality', 0.1,
            'documents', 0.1
        ),
        'recommendations', CASE health_status
            WHEN 'excellent' THEN 'maintain_current_performance'
            WHEN 'good' THEN 'continue_monitoring'
            WHEN 'fair' THEN 'increase_oversight'
            WHEN 'at_risk' THEN 'implement_recovery_plan'
            ELSE 'escalate_to_management'
        END
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. EARNED VALUE METRICS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_earned_value(project_id_param UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSONB;
    pv DECIMAL(15, 2); -- Planned Value
    ev DECIMAL(15, 2); -- Earned Value
    ac DECIMAL(15, 2); -- Actual Cost
    spi DECIMAL(5, 4); -- Schedule Performance Index
    cpi DECIMAL(5, 4); -- Cost Performance Index
    sv DECIMAL(15, 2); -- Schedule Variance
    cv DECIMAL(15, 2); -- Cost Variance
    eac DECIMAL(15, 2); -- Estimate at Completion
    etc DECIMAL(15, 2); -- Estimate to Complete
    vac DECIMAL(15, 2); -- Variance at Completion
    bac DECIMAL(15, 2); -- Budget at Completion
BEGIN
    -- Get budget at completion
    SELECT SUM(original_amount) INTO bac
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = 1);
    
    -- Calculate Planned Value (budgeted for scheduled work)
    SELECT SUM(original_amount * (progress / 100.0)) INTO pv
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param));
    
    -- Calculate Earned Value (budgeted for completed work)
    SELECT SUM(
        CASE 
            WHEN t.percent_complete IS NULL THEN 0
            ELSE COALESCE(bli.original_amount, 0) * (t.percent_complete / 100.0)
        END
    ) INTO ev
    FROM tasks t
    LEFT JOIN budget_line_items bli ON bli.budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param)
    WHERE t.project_id = project_id_param;
    
    -- Calculate Actual Cost
    SELECT SUM(actual_amount) INTO ac
    FROM budget_line_items 
    WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param));
    
    -- Calculate performance indices
    spi := CASE WHEN pv > 0 THEN ev / pv ELSE 1 END;
    cpi := CASE WHEN ac > 0 THEN ev / ac ELSE 1 END;
    sv := ev - pv;
    cv := ev - ac;
    
    -- Calculate forecasts
    eac := CASE 
        WHEN cpi > 0 AND spi > 0 THEN bac / (cpi * spi)
        WHEN cpi > 0 THEN bac / cpi
        ELSE bac
    END;
    etc := eac - ac;
    vac := bac - eac;
    
    SELECT jsonb_build_object(
        'project_id', project_id_param,
        'bac', COALESCE(bac, 0),
        'pv', COALESCE(pv, 0),
        'ev', COALESCE(ev, 0),
        'ac', COALESCE(ac, 0),
        'spi', ROUND(COALESCE(spi, 1)::numeric, 4),
        'cpi', ROUND(COALESCE(cpi, 1)::numeric, 4),
        'sv', COALESCE(sv, 0),
        'cv', COALESCE(cv, 0),
        'eac', COALESCE(eac, 0),
        'etc', COALESCE(etc, 0),
        'vac', COALESCE(vac, 0),
        'schedule_status', CASE WHEN spi >= 1 THEN 'on_schedule' WHEN spi >= 0.9 THEN 'slightly_behind' ELSE 'behind_schedule' END,
        'cost_status', CASE WHEN cpi >= 1 THEN 'on_budget' WHEN cpi >= 0.9 THEN 'slightly_over' ELSE 'over_budget' END,
        'performance_trend', CASE 
            WHEN spi >= 1 AND cpi >= 1 THEN 'excellent'
            WHEN spi >= 0.9 AND cpi >= 0.9 THEN 'acceptable'
            ELSE 'needs_improvement'
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. DAILY LOG AGGREGATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_daily_log_summary(project_id_param UUID, start_date DATE, end_date DATE) 
RETURNS TABLE(
    log_date DATE,
    log_number TEXT,
    headcount_total INTEGER,
    headcount_company INTEGER,
    headcount_subcontractor INTEGER,
    work_performed TEXT,
    weather_conditions TEXT,
    temperature_avg DECIMAL,
    incidents_count INTEGER,
    issues_count INTEGER,
    progress_percent DECIMAL
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl.date as log_date,
        dl.log_number,
        dl.headcount_total,
        dl.headcount_company,
        dl.headcount_subcontractor,
        dl.work_performed,
        wl.conditions as weather_conditions,
        wl.temperature_avg,
        (SELECT COUNT(*) FROM safety_incidents si WHERE si.project_id = project_id_param AND DATE(si.occurrence_date) = dl.date) as incidents_count,
        (SELECT COUNT(*) FROM defects d WHERE d.project_id = project_id_param AND DATE(d.created_at) = dl.date) as issues_count,
        p.progress as progress_percent
    FROM daily_logs dl
    LEFT JOIN weather_logs wl ON wl.id = dl.weather_id
    LEFT JOIN projects p ON p.id = project_id_param
    WHERE dl.project_id = project_id_param
    AND dl.date BETWEEN start_date AND end_date
    ORDER BY dl.date DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RESOURCE UTILIZATION REPORT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_resource_utilization(company_id_param UUID, start_date DATE, end_date DATE) 
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    role TEXT,
    total_hours DECIMAL,
    billable_hours DECIMAL,
    non_billable_hours DECIMAL,
    utilization_percent DECIMAL,
    project_count INTEGER,
    task_count INTEGER,
    revenue_generated DECIMAL
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.name as user_name,
        u.role,
        COALESCE(hours.total, 0) as total_hours,
        COALESCE(hours.billable, 0) as billable_hours,
        COALESCE(hours.non_billable, 0) as non_billable_hours,
        ROUND((COALESCE(hours.total, 0) / 160.0 * 100)::numeric, 2) as utilization_percent,
        COALESCE(projects.cnt, 0) as project_count,
        COALESCE(tasks.cnt, 0) as task_count,
        COALESCE(rev.total, 0) as revenue_generated
    FROM users u
    LEFT JOIN (
        SELECT 
            user_id,
            SUM(duration_minutes / 60.0) as total,
            SUM(CASE WHEN billable THEN duration_minutes / 60.0 ELSE 0 END) as billable,
            SUM(CASE WHEN NOT billable THEN duration_minutes / 60.0 ELSE 0 END) as non_billable
        FROM time_entries
        WHERE company_id = company_id_param
        AND start_time >= start_date
        AND start_time <= end_date
        GROUP BY user_id
    ) hours ON hours.user_id = u.id
    LEFT JOIN (
        SELECT assigned_to, COUNT(DISTINCT project_id) as cnt
        FROM tasks
        WHERE project_id IN (SELECT id FROM projects WHERE company_id = company_id_param)
        AND assigned_to IS NOT NULL
        GROUP BY assigned_to
    ) projects ON projects.assigned_to = u.id
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as cnt
        FROM tasks
        WHERE assigned_to IS NOT NULL
        AND created_at >= start_date
        AND created_at <= end_date
        GROUP BY assigned_to
    ) tasks ON tasks.assigned_to = u.id
    LEFT JOIN (
        SELECT 
            te.user_id,
            SUM(te.total_amount) as total
        FROM time_entries te
        WHERE te.company_id = company_id_param
        AND te.billable = true
        AND te.start_time >= start_date
        AND te.start_time <= end_date
        GROUP BY te.user_id
    ) rev ON rev.user_id = u.id
    WHERE u.company_id = company_id_param
    AND u.is_active = true
    ORDER BY utilization_percent DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. SAFETY INCIDENT SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_safety_summary(project_id_param UUID, year_param INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)) 
RETURNS JSONB 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSONB;
    total_incidents INTEGER;
    lost_time_incidents INTEGER;
    medical_treatment_incidents INTEGER;
    first_aid_incidents INTEGER;
    near_misses INTEGER;
    total_incident_cost DECIMAL(15, 2);
    trir DECIMAL(10, 2); -- Total Recordable Incident Rate
    ltir DECIMAL(10, 2); -- Lost Time Incident Rate
    project_start_date DATE;
    avg_headcount DECIMAL(10, 2);
    total_hours_worked DECIMAL(15, 2);
BEGIN
    -- Get project start date
    SELECT start_date INTO project_start_date
    FROM projects WHERE id = project_id_param;
    
    -- Count incidents by category
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE category IN ('lost_time', 'fatal')) as lost_time,
        COUNT(*) FILTER (WHERE category IN ('medical_treatment', 'first_aid')) as medical,
        COUNT(*) FILTER (WHERE category = 'first_aid') as first_aid,
        COUNT(*) FILTER (WHERE category = 'near_miss') as near_miss,
        SUM(COALESCE(property_damage_cost, 0)) as total_cost
    INTO total_incidents, lost_time_incidents, medical_treatment_incidents, first_aid_incidents, near_misses, total_incident_cost
    FROM safety_incidents
    WHERE project_id = project_id_param
    AND EXTRACT(YEAR FROM occurrence_date) = year_param;
    
    -- Calculate average headcount
    SELECT AVG(headcount_total) INTO avg_headcount
    FROM daily_logs
    WHERE project_id = project_id_param
    AND EXTRACT(YEAR FROM date) = year_param;
    
    -- Estimate total hours worked (avg_headcount * 40 hours/week * 52 weeks)
    total_hours_worked := COALESCE(avg_headcount, 1) * 40 * 52;
    
    -- Calculate TRIR (per 200,000 hours)
    trir := (total_incidents * 200000.0) / NULLIF(total_hours_worked, 0);
    
    -- Calculate LTIR
    ltir := (lost_time_incidents * 200000.0) / NULLIF(total_hours_worked, 0);
    
    SELECT jsonb_build_object(
        'project_id', project_id_param,
        'year', year_param,
        'total_incidents', COALESCE(total_incidents, 0),
        'lost_time_incidents', COALESCE(lost_time_incidents, 0),
        'medical_treatment_incidents', COALESCE(medical_treatment_incidents, 0),
        'first_aid_incidents', COALESCE(first_aid_incidents, 0),
        'near_misses', COALESCE(near_misses, 0),
        'total_incident_cost', COALESCE(total_incident_cost, 0),
        'trir', ROUND(COALESCE(trir, 0)::numeric, 2),
        'ltir', ROUND(COALESCE(ltir, 0)::numeric, 2),
        'avg_headcount', ROUND(COALESCE(avg_headcount, 0)::numeric, 0),
        'total_hours_worked', ROUND(COALESCE(total_hours_worked, 0)::numeric, 0),
        'safety_rating', CASE 
            WHEN trir = 0 THEN 'excellent'
            WHEN trir < 3 THEN 'good'
            WHEN trir < 6 THEN 'acceptable'
            ELSE 'needs_improvement'
        END,
        'industry_comparison', CASE 
            WHEN trir < 2.5 THEN 'better_than_industry'
            WHEN trir < 5.0 THEN 'at_industry_average'
            ELSE 'below_industry_average'
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. DOCUMENT STATUS REPORT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_document_status(project_id_param UUID) 
RETURNS TABLE(
    category TEXT,
    total_documents INTEGER,
    approved_documents INTEGER,
    pending_documents INTEGER,
    rejected_documents INTEGER,
    latest_revision TEXT,
    last_uploaded TIMESTAMPTZ
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(dc.name, 'Uncategorized') as category,
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE d.status = 'approved') as approved_documents,
        COUNT(*) FILTER (WHERE d.status IN ('draft', 'under_review')) as pending_documents,
        COUNT(*) FILTER (WHERE d.status = 'rejected') as rejected_documents,
        MAX(d.revision) as latest_revision,
        MAX(d.created_at) as last_uploaded
    FROM documents d
    LEFT JOIN document_categories dc ON dc.id = d.category_id
    WHERE d.project_id = project_id_param
    AND d.deleted_at IS NULL
    GROUP BY dc.name
    ORDER BY total_documents DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Generate unique project number
CREATE OR REPLACE FUNCTION generate_project_number(company_id_param UUID, year_param INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)) 
RETURNS TEXT 
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    prefix TEXT;
    sequence INTEGER;
BEGIN
    prefix := company_id_param::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM '^[^-]+-(\\d+)$' AS INTEGER)), 0) + 1, 1) INTO sequence
    FROM projects
    WHERE company_id = company_id_param
    AND EXTRACT(YEAR FROM created_at) = year_param;
    
    RETURN prefix || '-' || year_param::TEXT || '-' || LPAD(sequence::TEXT, 4, '0');
END;
$$;

-- Generate unique document number
CREATE OR REPLACE FUNCTION generate_document_number(project_id_param UUID, doctype TEXT DEFAULT 'DOC') 
RETURNS TEXT 
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    sequence INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '^.*-(\\d+)$' AS INTEGER)), 0) + 1, 1) INTO sequence
    FROM documents
    WHERE project_id = project_id_param;
    
    RETURN doctype || '-' || project_id_param::TEXT || '-' || LPAD(sequence::TEXT, 4, '0');
END;
$$;

-- Calculate working days between two dates
CREATE OR REPLACE FUNCTION calculate_working_days(start_date_param DATE, end_date_param DATE) 
RETURNS INTEGER 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    working_days INTEGER := 0;
    current_date DATE := start_date_param;
BEGIN
    WHILE current_date <= end_date_param LOOP
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            working_days := working_days + 1;
        END IF;
        current_date := current_date + 1;
    END LOOP;
    
    RETURN working_days;
END;
$$;

-- Format currency
CREATE OR REPLACE FUNCTION format_currency(amount DECIMAL, currency TEXT DEFAULT 'USD') 
RETURNS TEXT 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN CASE currency
        WHEN 'USD' THEN '$' || TO_CHAR(amount, '999,999,999.00')
        WHEN 'EUR' THEN '€' || TO_CHAR(amount, '999,999,999.00')
        WHEN 'GBP' THEN '£' || TO_CHAR(amount, '999,999,999.00')
        ELSE TO_CHAR(amount, '999,999,999.00') || ' ' || currency
    END;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- End of Stored Procedures
-- ═══════════════════════════════════════════════════════════════════════════
