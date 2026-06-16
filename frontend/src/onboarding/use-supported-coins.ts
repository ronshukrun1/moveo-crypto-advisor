import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../api/api-error';
import { getSupportedCoins } from '../api/coins';
import type { Coin } from '../types/coin';

type CoinsLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; coins: Coin[] }
  | { status: 'error'; message: string }
  | { status: 'empty' };

export function useSupportedCoins() {
  const [state, setState] = useState<CoinsLoadState>({ status: 'idle' });
  const hasRequestedRef = useRef(false);

  const loadCoins = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const response = await getSupportedCoins();

      if (response.items.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      setState({ status: 'success', coins: response.items });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to load supported coins right now. Please try again.';

      setState({ status: 'error', message });
    }
  }, []);

  const loadIfNeeded = useCallback(() => {
    if (hasRequestedRef.current && state.status !== 'error' && state.status !== 'idle') {
      return;
    }

    hasRequestedRef.current = true;
    void loadCoins();
  }, [loadCoins, state.status]);

  const reload = useCallback(() => {
    hasRequestedRef.current = true;
    void loadCoins();
  }, [loadCoins]);

  return {
    ...state,
    loadIfNeeded,
    reload,
    isLoaded: state.status === 'success',
  };
}
