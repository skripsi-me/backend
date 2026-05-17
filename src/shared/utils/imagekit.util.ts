import ImageKit from 'imagekit';
import { env } from '../../config/env.js';

export const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadImage = async (file: Buffer, fileName: string): Promise<string> => {
  const result = await imagekit.upload({
    file,
    fileName,
    folder: '/products',
  });
  return result.url;
};
