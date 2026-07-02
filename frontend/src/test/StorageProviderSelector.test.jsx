import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StorageProviderSelector from '../components/files/StorageProviderSelector';

const ALL_PROVIDERS = ['LOCAL', 'S3', 'GOOGLE_DRIVE', 'ONEDRIVE', 'SFTP'];

describe('StorageProviderSelector', () => {
  it('renders the active provider label in the button', () => {
    render(
      <StorageProviderSelector
        activeProvider="S3"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toHaveTextContent('Amazon S3');
  });

  it('shows active provider chip', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('active-provider-chip')).toBeInTheDocument();
  });

  it('opens provider menu when button is clicked', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    expect(screen.getByTestId('provider-option-S3')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-SFTP')).toBeInTheDocument();
  });

  it('calls onSwitch with the selected provider', () => {
    const onSwitch = vi.fn();
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={onSwitch}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    fireEvent.click(screen.getByTestId('provider-option-S3'));
    expect(onSwitch).toHaveBeenCalledWith('S3');
  });

  it('does not call onSwitch when selecting the already-active provider', () => {
    const onSwitch = vi.fn();
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={onSwitch}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    fireEvent.click(screen.getByTestId('provider-option-LOCAL'));
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('disables the button while switching', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={true}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toBeDisabled();
  });

  it('renders a fallback label for unknown provider keys', () => {
    render(
      <StorageProviderSelector
        activeProvider="CUSTOM_CLOUD"
        availableProviders={['CUSTOM_CLOUD']}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toHaveTextContent('CUSTOM_CLOUD');
  });
});
