import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { MarketItem as MarketItemType } from './dashboard.types';
import { formatPercentageChange, formatUsdPrice } from '../utils/formatting';

interface MarketItemProps {
  item: MarketItemType;
}

export function MarketItem({ item }: MarketItemProps) {
  const change = formatPercentageChange(item.changePercentage24h);
  const changeColor =
    change.direction === 'positive'
      ? 'success.main'
      : change.direction === 'negative'
        ? 'error.main'
        : 'text.secondary';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Avatar
        src={item.imageUrl ?? undefined}
        alt=""
        variant="rounded"
        sx={{ width: 40, height: 40, bgcolor: 'background.paper' }}
      >
        {item.symbol.slice(0, 1)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>
          <Typography variant="metadata" color="text.secondary">
            {item.symbol.toUpperCase()}
          </Typography>
          {item.marketCapRank ? (
            <Typography variant="metadata" color="text.secondary">
              #{item.marketCapRank}
            </Typography>
          ) : null}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {formatUsdPrice(item.currentPrice)}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{ color: changeColor, whiteSpace: 'nowrap', fontWeight: 600 }}
        aria-label={`24 hour change ${change.label}`}
      >
        {change.label}
      </Typography>
    </Box>
  );
}
