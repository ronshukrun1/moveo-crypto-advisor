import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SelectableCard } from '../../components/common/SelectableCard';
import { LoadingState } from '../../components/states/LoadingState';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import type { Coin } from '../../types/coin';

interface CoinSelectionStepProps {
  coinsState:
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; coins: Coin[] }
    | { status: 'error'; message: string }
    | { status: 'empty' };
  selectedCoinIds: number[];
  onToggleCoin: (coinId: number) => void;
  onRetry: () => void;
  error?: string | null;
}

function CoinAvatar({ symbol }: { symbol: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: 'rgba(67, 214, 200, 0.12)',
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.8rem',
        letterSpacing: '0.04em',
      }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </Box>
  );
}

export function CoinSelectionStep({
  coinsState,
  selectedCoinIds,
  onToggleCoin,
  onRetry,
  error,
}: CoinSelectionStepProps) {
  return (
    <Box>
      {coinsState.status === 'success' ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Typography variant="metadata">{selectedCoinIds.length} selected</Typography>
        </Box>
      ) : null}

      {error ? (
        <Typography variant="body2" color="error.main" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      {coinsState.status === 'loading' || coinsState.status === 'idle' ? (
        <LoadingState message="Loading supported coins…" />
      ) : null}

      {coinsState.status === 'error' ? (
        <ErrorState
          title="Unable to load coins"
          message={coinsState.message}
          actionLabel="Retry"
          onAction={onRetry}
        />
      ) : null}

      {coinsState.status === 'empty' ? (
        <EmptyState
          title="No coins available"
          message="Supported coins are not available right now. Please try again later."
        />
      ) : null}

      {coinsState.status === 'success' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {coinsState.coins.map((coin) => (
            <SelectableCard
              key={coin.id}
              title={coin.symbol.toUpperCase()}
              description={coin.name}
              icon={<CoinAvatar symbol={coin.symbol} />}
              selected={selectedCoinIds.includes(coin.id)}
              onClick={() => onToggleCoin(coin.id)}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
