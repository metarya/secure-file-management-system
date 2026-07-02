import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StorageProviderSelector, { PROVIDER_META } from '../components/files/StorageProviderSelector';

const ALL_PROVIDERS = ['LOCAL', 'S3', 'GOOGLE_DRIVE', 'ONEDRIVE', 'SFTP'];

describe('StorageProviderSelector — labels and rendering', () => {
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

  it('renders LOCAL label for local storage', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={ALL_PROVIDERS}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toHaveTextContent('Local Storage');
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

describe('StorageProviderSelector — provider metadata', () => {
  it('PROVIDER_META has entries for all five known providers', () => {
    expect(PROVIDER_META).toHaveProperty('LOCAL');
    expect(PROVIDER_META).toHaveProperty('S3');
    expect(PROVIDER_META).toHaveProperty('GOOGLE_DRIVE');
    expect(PROVIDER_META).toHaveProperty('ONEDRIVE');
    expect(PROVIDER_META).toHaveProperty('SFTP');
  });

  it('each provider metadata entry has label, color, and Icon', () => {
    for (const key of Object.keys(PROVIDER_META)) {
      const m = PROVIDER_META[key];
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('color');
      expect(m).toHaveProperty('Icon');
      expect(typeof m.color).toBe('string');
      expect(m.color).toMatch(/^#[0-9a-fA-F]{6}$/); // valid hex color
    }
  });

  it('S3 has AWS orange brand color', () => {
    expect(PROVIDER_META.S3.color).toBe('#ff9900');
  });

  it('GOOGLE_DRIVE has Google blue brand color', () => {
    expect(PROVIDER_META.GOOGLE_DRIVE.color).toBe('#4285F4');
  });

  it('ONEDRIVE has Microsoft blue brand color', () => {
    expect(PROVIDER_META.ONEDRIVE.color).toBe('#0078D4');
  });

  it('SFTP has green brand color', () => {
    expect(PROVIDER_META.SFTP.color).toBe('#10b981');
  });
});

describe('StorageProviderSelector — dropdown interaction', () => {
  it('opens provider menu when button is clicked (multi-provider)', () => {
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
});

describe('StorageProviderSelector — single-provider state', () => {
  it('disables the button when only one provider is available', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={['LOCAL']}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toBeDisabled();
  });

  it('does not open the menu when single provider is clicked', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={['LOCAL']}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    // button is disabled, menu should not open
    const btn = screen.getByTestId('provider-selector-button');
    fireEvent.click(btn);
    // no provider-option elements should appear
    expect(screen.queryByTestId('provider-option-LOCAL')).not.toBeInTheDocument();
  });

  it('still renders the button label for single provider', () => {
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={['LOCAL']}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('provider-selector-button')).toHaveTextContent('Local Storage');
  });
});

describe('StorageProviderSelector — only connected providers shown', () => {
  it('shows only providers in availableProviders list', () => {
    // Backend returns only LOCAL + GOOGLE_DRIVE (user configured only those)
    const connected = ['LOCAL', 'GOOGLE_DRIVE'];
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={connected}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    expect(screen.getByTestId('provider-option-LOCAL')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-GOOGLE_DRIVE')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-S3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-ONEDRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-SFTP')).not.toBeInTheDocument();
  });

  it('shows two providers when LOCAL and SFTP are connected', () => {
    const connected = ['LOCAL', 'SFTP'];
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={connected}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    expect(screen.getByTestId('provider-option-LOCAL')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-SFTP')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-S3')).not.toBeInTheDocument();
  });

  it('shows only LOCAL and S3 when those two are connected', () => {
    const connected = ['LOCAL', 'S3'];
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={connected}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    expect(screen.getByTestId('provider-option-LOCAL')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-S3')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-GOOGLE_DRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-ONEDRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-SFTP')).not.toBeInTheDocument();
  });

  it('shows only LOCAL and Google Drive when those two are connected', () => {
    const connected = ['LOCAL', 'GOOGLE_DRIVE'];
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={connected}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));
    expect(screen.getByTestId('provider-option-LOCAL')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-GOOGLE_DRIVE')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-S3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-ONEDRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-SFTP')).not.toBeInTheDocument();
  });
});

describe('StorageProviderSelector — no unconnected providers rendered', () => {
  it('renders no options for providers absent from availableProviders', () => {
    // Backend returns only LOCAL — simulates a user with no cloud credentials.
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={['LOCAL']}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    // Button is disabled (single provider), menu cannot open — but even if it
    // could, none of the cloud provider options should be in the DOM.
    expect(screen.queryByTestId('provider-option-S3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-GOOGLE_DRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-ONEDRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-SFTP')).not.toBeInTheDocument();
  });

  it('renders exactly the providers returned by the backend — no extras', () => {
    // Simulate backend returning LOCAL + ONEDRIVE (user configured only those two).
    const connected = ['LOCAL', 'ONEDRIVE'];
    render(
      <StorageProviderSelector
        activeProvider="LOCAL"
        availableProviders={connected}
        switching={false}
        onSwitch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('provider-selector-button'));

    // Only the connected ones appear.
    expect(screen.getByTestId('provider-option-LOCAL')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-ONEDRIVE')).toBeInTheDocument();

    // Unconnected providers must NOT appear in any form.
    expect(screen.queryByTestId('provider-option-S3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-GOOGLE_DRIVE')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-option-SFTP')).not.toBeInTheDocument();
  });
});
