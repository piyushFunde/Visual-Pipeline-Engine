import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import { PipelineToolbar } from './toolbar';

describe('PipelineToolbar', () => {
  test('renders save, load, and execute buttons', () => {
    render(<PipelineToolbar />);

    expect(screen.getByRole('button', { name: /save pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execute pipeline/i })).toBeInTheDocument();
  });
});
