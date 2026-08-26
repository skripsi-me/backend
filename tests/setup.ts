import { vi } from 'vitest';

// Mock ImageKit SDK
vi.mock('imagekit', () => {
  return {
    default: class {
      upload = vi.fn().mockResolvedValue({
        url: 'https://ik.imagekit.io/mock/test.jpg',
        fileId: 'mock_id'
      });
    }
  };
});

// Mock environment for tests if needed
process.env.JWT_SECRET = 'test_secret_key_long_enough_for_jwt';
process.env.COOKIE_SECRET = 'test_cookie_secret_key_long_enough';
process.env.BULK_UPLOAD_KEY = 'test_bulk_key';
