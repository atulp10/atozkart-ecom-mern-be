import { v2 as cloudinary } from 'cloudinary';
import { getConfig } from '../config/env.js';

const config = getConfig();
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryKey,
  api_secret: config.cloudinarySecret,
});

export { cloudinary };
