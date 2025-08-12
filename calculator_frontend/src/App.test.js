import { render, screen } from '@testing-library/react';
import App from './App';

test('renders scientific calculator title and display', () => {
  render(<App />);
  expect(screen.getByText(/Scientific Calculator/i)).toBeInTheDocument();
  expect(screen.getByTestId('display')).toBeInTheDocument();
});
