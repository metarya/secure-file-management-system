import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api client before importing fileApi
vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    patch: vi.fn(),
    raw: vi.fn(),
  },
}));

import { api } from '../lib/apiClient';
import { getMyFiles, searchMyFiles } from '../api/fileApi';

describe('fileApi provider filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue([]);
  });

  it('getMyFiles with no provider calls /files/my-files without query param', async () => {
    await getMyFiles();
    expect(api.get).toHaveBeenCalledWith('/files/my-files');
  });

  it('getMyFiles with provider appends ?provider= param', async () => {
    await getMyFiles('S3');
    expect(api.get).toHaveBeenCalledWith('/files/my-files?provider=S3');
  });

  it('getMyFiles encodes provider name', async () => {
    await getMyFiles('GOOGLE_DRIVE');
    expect(api.get).toHaveBeenCalledWith('/files/my-files?provider=GOOGLE_DRIVE');
  });

  it('searchMyFiles with no provider uses only name param', async () => {
    await searchMyFiles('report');
    expect(api.get).toHaveBeenCalledWith('/files/search?name=report');
  });

  it('searchMyFiles with provider appends both params', async () => {
    await searchMyFiles('report', 'S3');
    expect(api.get).toHaveBeenCalledWith('/files/search?name=report&provider=S3');
  });

  it('searchMyFiles encodes special chars in name', async () => {
    await searchMyFiles('my file');
    expect(api.get).toHaveBeenCalledWith('/files/search?name=my%20file');
  });
});
