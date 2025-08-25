# S3 Streaming Endpoints

## Overview
These endpoints provide streaming capabilities for images and videos directly from S3-compatible storage (including Timeweb S3).

## Configuration

### Environment Variables
Configure your S3 storage by setting these environment variables:

```env
# S3 Configuration (works with Timeweb S3)
AWS_ENDPOINT_URL=https://s3.timeweb.cloud  # Timeweb S3 endpoint
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ru-1  # Timeweb region
AWS_BUCKET_NAME=your_bucket_name
```

## Endpoints

### Stream Image
**GET** `/api/files/stream/image/{path}`

Streams an image file from S3 storage.

#### Parameters
- `path` - Full path to the image in the S3 bucket (including nested folders)

#### Example
```
GET /api/files/stream/image/users/123/profile/avatar.jpg
GET /api/files/stream/image/content/2024/images/photo.png
```

#### Response
- Returns the image data with appropriate content-type header
- Includes caching headers (1 day cache)
- Status 404 if image not found
- Status 500 for server errors

### Stream Video
**GET** `/api/files/stream/video/{path}`

Streams a video file from S3 storage with support for range requests (partial content).

#### Parameters
- `path` - Full path to the video in the S3 bucket (including nested folders)

#### Headers
- `Range` (optional) - Supports byte-range requests for video seeking
  - Example: `Range: bytes=0-1023`

#### Example
```
GET /api/files/stream/video/courses/intro/lesson1.mp4
GET /api/files/stream/video/media/2024/videos/presentation.webm
```

#### Response
- Returns video data with appropriate content-type header
- Supports HTTP 206 (Partial Content) for range requests
- Includes Accept-Ranges header for video seeking support
- Status 404 if video not found
- Status 500 for server errors

## Supported File Types

### Images
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG
- BMP
- ICO

### Videos
- MP4
- WebM
- OGG
- AVI
- MOV
- WMV
- FLV
- MKV
- M4V
- 3GP

## Usage Examples

### Frontend (HTML)
```html
<!-- Image -->
<img src="/api/files/stream/image/path/to/image.jpg" alt="Image">

<!-- Video -->
<video controls>
  <source src="/api/files/stream/video/path/to/video.mp4" type="video/mp4">
</video>
```

### Frontend (React)
```jsx
// Image component
<img 
  src={`/api/files/stream/image/${imagePath}`} 
  alt="Streamed image"
/>

// Video component
<video controls>
  <source 
    src={`/api/files/stream/video/${videoPath}`} 
    type="video/mp4"
  />
</video>
```

## Security Notes
- Endpoints require JWT authentication (inherited from parent router)
- User ban check is applied
- No direct file system access - all operations go through S3 client

## Performance Considerations
- Images are cached by the browser for 1 day
- Videos support range requests for efficient streaming
- Large video files are streamed in chunks to reduce memory usage