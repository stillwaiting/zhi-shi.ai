import React from 'react';
import { render, screen } from '@testing-library/react';
import SentenceComponent from './SentenceComponent';
import '@testing-library/jest-dom'

test('renders without dropdowns', () => {
  render(<SentenceComponent sentence="Hello, world!" onSubmit={() => {}} />);
  const text = screen.getByText(/Hello, world!/i);
  expect(text).toBeInTheDocument();
});
