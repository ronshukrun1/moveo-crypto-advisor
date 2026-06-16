import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, normalizeApiError } from '../api/api-error';
import { getDashboard } from '../api/dashboard';
import { useAuth } from '../auth/auth-context';
import type { DashboardResponse } from './dashboard.types';

export type DashboardLoadPhase = 'initial' | 'ready' | 'refreshing' | 'error';

interface UseDashboardResult {
  dashboard: DashboardResponse | null;
  phase: DashboardLoadPhase;
  error: ApiError | null;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [phase, setPhase] = useState<DashboardLoadPhase>('initial');
  const [error, setError] = useState<ApiError | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const loadDashboard = useCallback(
    async (mode: 'initial' | 'refresh' | 'retry') => {
      if (mode === 'refresh' && hasLoadedOnceRef.current) {
        setPhase('refreshing');
      } else if (mode !== 'refresh') {
        setPhase('initial');
      }

      setError(null);

      try {
        const response = await getDashboard();
        setDashboard(response);
        hasLoadedOnceRef.current = true;
        setPhase('ready');
      } catch (caughtError) {
        const apiError = normalizeApiError(caughtError);

        if (apiError.statusCode === 409) {
          await refreshUser();
          navigate('/onboarding', { replace: true });
          return;
        }

        if (apiError.statusCode === 401) {
          return;
        }

        setError(apiError);
        setPhase(hasLoadedOnceRef.current ? 'ready' : 'error');
      }
    },
    [navigate, refreshUser],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void loadDashboard('initial');
  }, [loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard('refresh');
  }, [loadDashboard]);

  const retry = useCallback(async () => {
    await loadDashboard('retry');
  }, [loadDashboard]);

  return {
    dashboard,
    phase,
    error,
    refresh,
    retry,
  };
}
