export const DONATION_APPROVAL_WINDOW_HOURS = 72;

export const DONATION_STATUS_LABELS = {
  approved: 'Aprovada',
  pending: 'Pendente',
  reversed: 'Estornada',
} as const;

export const DONATION_REVERSAL_REASON_LABELS = {
  rejected: 'Reprovada pelo organizador',
  expired: 'Expirada (72h sem resposta)',
} as const;
