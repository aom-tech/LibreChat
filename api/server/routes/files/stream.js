const express = require('express');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { initializeS3 } = require('~/server/services/Files/S3/initialize');
const { logger } = require('~/config');

const router = express.Router();

const bucketName = process.env.AWS_BUCKET_NAME;

/**
 * Stream image from S3 bucket
 * @route GET /files/stream/image/*
 * The path after /image/ will be used as the full S3 key
 * Example: /files/stream/image/folder/subfolder/image.jpg
 */
router.get('/image/*', async (req, res) => {
  try {
    // Get the full path after /image/
    const key = req.params[0];

    if (!key) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const s3 = initializeS3();
    if (!s3) {
      return res.status(500).json({ error: 'S3 client not initialized' });
    }

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    // Set appropriate headers for image
    const filename = key.split('/').pop();
    const contentType = data.ContentType || getContentTypeByExtension(filename, 'image');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Stream the image
    data.Body.pipe(res);
  } catch (error) {
    logger.error('[/stream/image] Error streaming image from S3:', error);

    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.status(500).json({ error: 'Error streaming image', message: error.message });
  }
});

/**
 * Stream video from S3 bucket with range support
 * @route GET /files/stream/video/*
 * The path after /video/ will be used as the full S3 key
 * Example: /files/stream/video/folder/subfolder/video.mp4
 */
router.get('/video/*', async (req, res) => {
  try {
    // Get the full path after /video/
    const key = req.params[0];

    if (!key) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const s3 = initializeS3();
    if (!s3) {
      return res.status(500).json({ error: 'S3 client not initialized' });
    }

    // Handle range requests for video streaming
    const range = req.headers.range;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    if (range) {
      // Parse Range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);

      // First, get the object metadata to know the file size
      const headCommand = new GetObjectCommand(params);
      const headData = await s3.send(headCommand);
      const fileSize = headData.ContentLength;

      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Add range to params for partial content
      params.Range = `bytes=${start}-${end}`;

      const command = new GetObjectCommand(params);
      const data = await s3.send(command);

      // Set headers for partial content
      const filename = key.split('/').pop();
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader(
        'Content-Type',
        data.ContentType || getContentTypeByExtension(filename, 'video'),
      );

      // Stream the video chunk
      data.Body.pipe(res);
    } else {
      // No range request, stream entire video
      const command = new GetObjectCommand(params);
      const data = await s3.send(command);

      const filename = key.split('/').pop();
      res.setHeader(
        'Content-Type',
        data.ContentType || getContentTypeByExtension(filename, 'video'),
      );
      res.setHeader('Content-Length', data.ContentLength);
      res.setHeader('Accept-Ranges', 'bytes');

      // Stream the entire video
      data.Body.pipe(res);
    }
  } catch (error) {
    logger.error('[/stream/video] Error streaming video from S3:', error);

    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.status(500).json({ error: 'Error streaming video', message: error.message });
  }
});

/**
 * Helper function to determine content type based on file extension
 * @param {string} filename - The filename
 * @param {string} type - The media type (image or video)
 * @returns {string} The content type
 */
function getContentTypeByExtension(filename, type) {
  const ext = filename.split('.').pop().toLowerCase();

  if (type === 'image') {
    const imageTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
    };
    return imageTypes[ext] || 'image/jpeg';
  }

  if (type === 'video') {
    const videoTypes = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      mkv: 'video/x-matroska',
      m4v: 'video/x-m4v',
      '3gp': 'video/3gpp',
    };
    return videoTypes[ext] || 'video/mp4';
  }

  return 'application/octet-stream';
}

module.exports = router;
