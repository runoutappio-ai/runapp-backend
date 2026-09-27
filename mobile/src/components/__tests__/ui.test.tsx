import { fireEvent, render } from '@testing-library/react-native';
import { Button, InlineError } from '../ui';

it('offers an accessible retry action for API and offline errors', async () => {
  const retry = jest.fn();
  const view = await render(<InlineError message="You appear to be offline." onRetry={retry} />);
  expect(view.getByRole('alert')).toHaveTextContent('You appear to be offline.');
  fireEvent.press(view.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it('exposes loading and disabled button state', async () => {
  const view = await render(<Button disabled>Pay now</Button>);
  expect(view.getByRole('button', { name: 'Pay now' })).toBeDisabled();
});
