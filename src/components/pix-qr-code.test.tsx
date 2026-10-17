import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PixQRCode } from './pix-qr-code';

describe('PixQRCode Component', () => {
  it('renders nothing when value is empty', () => {
    const { container } = render(<PixQRCode value="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an accessible QR code container with SVG', () => {
    render(<PixQRCode value="00020126...6304ABCD" />);
    const qrContainer = screen.getByRole('img', { name: 'QR Code PIX para pagamento' });
    expect(qrContainer).toBeDefined();
    expect(qrContainer.querySelector('svg')).toBeDefined();
  });

  it('supports custom ariaLabel and custom className', () => {
    render(
      <PixQRCode
        value="00020126...6304ABCD"
        ariaLabel="QR Code Personalizado"
        className="custom-test-class"
      />
    );
    const qrContainer = screen.getByRole('img', { name: 'QR Code Personalizado' });
    expect(qrContainer).toBeDefined();
    expect(qrContainer.classList.contains('custom-test-class')).toBe(true);
  });
});
