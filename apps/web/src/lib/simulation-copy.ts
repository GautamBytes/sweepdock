import type { EventKind, SwapState } from '@sweepdock/core';

export const stateLabels: Record<SwapState, string> = {
  selected: 'Selected',
  quoting: 'Checking quote',
  review_ready: 'Ready to review',
  skipped: 'Skipped',
  awaiting_signature: 'Awaiting response',
  rejected: 'Declined',
  submitted: 'Wallet responded',
  confirming: 'Checking result',
  completed: 'Completed',
  partial: 'Partial result',
  aborted: 'Refunded',
  unknown: 'Unconfirmed',
};

export const eventLabels: Record<EventKind, string> = {
  quote_requested: 'Quote requested',
  quote_ready: 'Quote ready for review',
  quote_invalidated: 'Quote needs a refresh',
  skip: 'Token skipped',
  signature_requested: 'Wallet approval requested',
  signature_rejected: 'Wallet approval declined',
  message_returned: 'Wallet responded',
  transaction_found: 'Transaction found',
  receipt_verified: 'Expected result matched',
  partial_verified: 'Partial result matched',
  abort_verified: 'Full refund matched',
  status_unknown: 'Result unconfirmed',
};
