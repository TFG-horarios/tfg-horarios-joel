import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import userEvent from '@testing-library/user-event';

export function renderWithUser(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'> & {
    userEventOptions?: Parameters<typeof userEvent.setup>[0];
  }
) {
  const { userEventOptions, ...renderOptions } = options ?? {};

  return {
    user: userEvent.setup(userEventOptions),
    ...render(ui, renderOptions),
  };
}
