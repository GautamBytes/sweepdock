import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import userEvent from '@testing-library/user-event';

function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/demo']}>
      <App />
    </MemoryRouter>,
  );
  return user;
}

it('shows a labelled simulation and useful cleanup controls', () => {
  render(
    <MemoryRouter initialEntries={['/demo']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText('Simulation · no real funds')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Decide which tokens to keep.' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /review selection/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Connect wallet' }),
  ).not.toBeInTheDocument();
});

it('reviews and simulates a supported token without connecting a real wallet', async () => {
  const user = setup();
  await user.click(screen.getByRole('button', { name: /review selection/i }));
  expect(
    screen.getByRole('heading', { name: 'Review your cleanup' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Approve simulation' }));
  expect(screen.getByText('Simulated swap completed')).toBeInTheDocument();
});

it('explains an uneconomical balance and does not approve it', async () => {
  const user = setup();
  await user.click(screen.getByRole('checkbox', { name: 'Select REDO' }));
  await user.click(screen.getByRole('button', { name: /review selection/i }));
  expect(
    screen.getByText('REDO skipped: estimated cost is too high.'),
  ).toBeInTheDocument();
});

it('keeps an uncertain simulation paused without a retry button', async () => {
  const user = setup();
  await user.selectOptions(screen.getByLabelText('Demo outcome'), 'unknown');
  await user.click(screen.getByRole('button', { name: /review selection/i }));
  await user.click(screen.getByRole('button', { name: 'Approve simulation' }));
  expect(
    screen.getByText('Status not confirmed. Do not send again.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Approve simulation' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /retry/i }),
  ).not.toBeInTheDocument();
});

it('shows shared lifecycle events in Swap Doctor', async () => {
  const user = setup();
  await user.click(screen.getByRole('button', { name: /review selection/i }));
  await user.click(screen.getByRole('button', { name: 'Approve simulation' }));
  await user.click(screen.getByRole('link', { name: 'Swap Doctor' }));
  expect(
    screen.getByRole('heading', { name: 'Understand a simulated swap.' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Expected result matched')).toBeInTheDocument();
});
