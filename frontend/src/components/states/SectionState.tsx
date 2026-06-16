import type { ReactNode } from 'react';
import type { DashboardSectionStatus } from '../../types/dashboard';
import { DisabledState } from './DisabledState';
import { UnavailableState } from './UnavailableState';

interface SectionStateProps {
  status: DashboardSectionStatus;
  children?: ReactNode;
  unavailableMessage?: string;
  disabledMessage?: string;
}

export function SectionState({
  status,
  children,
  unavailableMessage,
  disabledMessage,
}: SectionStateProps) {
  if (status === 'disabled') {
    return <DisabledState message={disabledMessage} />;
  }

  if (status === 'unavailable') {
    return <UnavailableState message={unavailableMessage} />;
  }

  return <>{children}</>;
}
