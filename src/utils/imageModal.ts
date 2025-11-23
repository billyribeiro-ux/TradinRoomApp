// ============================================================================
// IMAGE MODAL UTILITY - Competitor Pattern Implementation
// Microsoft Enterprise Standard
// ============================================================================

/**
 * Opens an image in a modal or new window based on keyboard modifiers
 * @param event - Mouse event (checks for shift/alt/ctrl)
 * @param url - Image URL to display
 * @param imageName - Optional custom image name
 */
export function openImageModal(
  event: MouseEvent | React.MouseEvent,
  url: string,
  imageName?: string
): void {
  // If shift, alt, or ctrl is pressed, open in new window
  if (event.shiftKey || event.altKey || event.ctrlKey) {
    const newWindow = window.open(
      '',
      '_blank',
      'toolbar=0,location=0,resizable=1,scrollbars=1'
    );

    if (!newWindow) {
      console.error('Failed to open new window - popup blocker may be active');
      return;
    }

    newWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${imageName || url}</title>
  <style>
    html,
    body {
      height: 100%;
      width: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: #000;
      margin: 0;
      padding: 0;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${url}" alt="${imageName || url}" />
</body>
</html>`);
    newWindow.document.close();
    return;
  }

  // Otherwise, trigger custom event for modal display
  const customEvent = new CustomEvent('openImageModal', {
    detail: { url, imageName: imageName || extractImageName(url) },
  });
  window.dispatchEvent(customEvent);
}

/**
 * Downloads an image to the user's device
 * @param url - Image URL to download
 * @param imageName - Optional custom filename
 */
export async function downloadImage(url: string, imageName?: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    
    const tag = document.createElement('a');
    tag.href = imageUrl;
    
    // Clean up filename
    let cleanName = imageName || url.split('/').pop() || 'image.jpg';
    cleanName = cleanName
      .replace(/^[^_]+_/, '') // Remove first part up to first _
      .replace(/_[^_]+(\.[^.]+)$/, '$1'); // Remove last part before extension
    
    tag.download = cleanName;
    tag.style.display = 'none';
    document.body.appendChild(tag);
    tag.click();
    document.body.removeChild(tag);
    
    // Clean up blob URL
    setTimeout(() => urlCreator.revokeObjectURL(imageUrl), 100);
  } catch (error) {
    console.error('Failed to download image:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

/**
 * Extracts clean image name from URL
 * @param url - Image URL
 * @returns Clean filename
 */
function extractImageName(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'image';
}

/**
 * Checks if a URL is an image
 * @param url - URL to check
 * @returns True if URL appears to be an image
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic|heif)(\?.*)?$/i;
  return imageExtensions.test(url);
}

/**
 * Checks if a URL is a PDF
 * @param url - URL to check
 * @returns True if URL appears to be a PDF
 */
export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url);
}
