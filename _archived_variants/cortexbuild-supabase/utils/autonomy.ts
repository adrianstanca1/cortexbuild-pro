import { supabase } from '../supabaseClient';
import { User } from '../types';

type StopFn = () => void;

const AUTONOMY_KEY = 'autonomy_enabled';

export function isAutonomyEnabled(): boolean {
    try {
        const raw = localStorage.getItem(AUTONOMY_KEY);
        return raw === 'true';
    } catch {
        return false;
    }
}

export function setAutonomyEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(AUTONOMY_KEY, String(enabled));
    } catch {
        // ignore storage errors
    }
}

/**
 * Starts autonomous background operations (safe, idempotent, optional).
 * - Weather-based schedule optimization (placeholder when schema missing)
 * - Auto-apply AI suggestions (if notifications table present)
 */
export function startAutonomousOps(currentUser: User | null): StopFn {
    if (!currentUser || !isAutonomyEnabled()) {
        return () => {};
    }

    const timers: number[] = [];
    const channelUnsubs: StopFn[] = [];

    // Weather-based optimization every 15 minutes
    const weatherTick = window.setInterval(async () => {
        try {
            if (!supabase) return;
            // Soft check for tasks table existence by doing a lightweight select with limit 1
            const probe = await supabase.from('tasks').select('id').limit(1);
            if (probe.error) return; // silently skip if table/policies not ready

            // Example placeholder: mark tasks with weather_sensitive=true as "review_pending"
            // In a real impl, fetch forecast and update schedule windows.
            await supabase
                .from('tasks')
                .update({ schedule_status: 'review_pending' })
                .eq('weather_sensitive', true);
        } catch {
            // ignore errors; autonomy must be non-intrusive
        }
    }, 15 * 60 * 1000);
    timers.push(weatherTick);

    // Auto-apply AI suggestions: when new notifications of type 'ai_suggestion' arrive, mark applied
    try {
        if (supabase) {
            const ch = supabase
                .channel(`autonomy:notifications:${currentUser.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUser.id}`
                }, async (payload: any) => {
                    try {
                        const rec = payload.new as any;
                        if (rec?.type === 'ai_suggestion' && !rec?.applied) {
                            await supabase.from('notifications').update({ applied: true }).eq('id', rec.id);
                        }
                    } catch {
                        // ignore per-event errors
                    }
                })
                .subscribe();

            channelUnsubs.push(() => { ch.unsubscribe(); });
        }
    } catch {
        // ignore subscription errors
    }

    return () => {
        timers.forEach((t) => window.clearInterval(t));
        channelUnsubs.forEach((fn) => fn());
    };
}


