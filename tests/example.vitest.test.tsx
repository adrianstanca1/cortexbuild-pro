import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';

// Example component for testing
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span data-testid=count>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
};

describe('Counter Component', () => {
  it('renders initial count of 0', () => {
    render(<Counter />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('increments count when button is clicked', () => {
    render(<Counter />);
    const button = screen.getByText('Increment');
    fireEvent.click(button);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('uses vitest matchers correctly', () => {
    expect(1 + 1).toBe(2);
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name');
  });
});

describe('Vitest Setup', () => {
  it('has access to vi (vitest utilities)', () => {
    const mockFn = vi.fn();
    mockFn('hello');
    expect(mockFn).toHaveBeenCalledWith('hello');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('has DOM matchers available', () => {
    const div = document.createElement('div');
    div.className = 'test-class';
    document.body.appendChild(div);
    
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('test-class');
    
    document.body.removeChild(div);
  });
});
