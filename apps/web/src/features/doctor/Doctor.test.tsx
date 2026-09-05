import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { Doctor } from './Doctor';

it('does not imply the original cleanup simulation is durably saved', () => {
  render(
    <MemoryRouter>
      <Doctor
        events={[
          {
            id: 'event-1',
            itemId: 'item-1',
            kind: 'signature_requested',
            observedAt: 0,
          },
        ]}
      />
    </MemoryRouter>,
  );
  expect(screen.queryByText(/request is saved/i)).not.toBeInTheDocument();
  expect(
    screen.getByText('Waiting for the simulated wallet response.'),
  ).toBeInTheDocument();
});

it('explains uncertain results without presenting them as failures or completion', () => {
  render(
    <MemoryRouter>
      <Doctor
        source="safety"
        events={[
          {
            id: 'event-1',
            itemId: 'item-1',
            kind: 'status_unknown',
            observedAt: 0,
          },
        ]}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('Safety lab · simulated events')).toBeInTheDocument();
  expect(
    screen.getByText(
      'The result is not confirmed. Keep the attempt paused and do not send again.',
    ),
  ).toBeInTheDocument();
});
