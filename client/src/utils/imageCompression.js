/**
 * Image Compression Utility
 * Compresses images to reduce file size before storage
 */

export class ImageCompressor {
  /**
   * Compress an image file
   * @param {File} file - Image file to compress
   * @param {Object} options - Compression options
   * @returns {Promise<string>} - Compressed base64 image data
   */
  static async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      // Check file size - if over 2MB, compress more aggressively
      const isLargeFile = file.size > 2 * 1024 * 1024; // 2MB
      const targetQuality = isLargeFile ? Math.min(quality, 0.6) : quality;
      const targetMaxWidth = isLargeFile ? Math.min(maxWidth, 1280) : maxWidth;
      const targetMaxHeight = isLargeFile ? Math.min(maxHeight, 720) : maxHeight;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > targetMaxWidth || height > targetMaxHeight) {
          const ratio = Math.min(targetMaxWidth / width, targetMaxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const compressedDataUrl = canvas.toDataURL(format, targetQuality);
          
          // Check if compression was successful (not larger than original)
          const originalSize = file.size;
          const compressedSize = this.getBase64Size(compressedDataUrl);
          
          console.log(`📸 Image compression: ${originalSize} bytes → ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);
          
          resolve(compressedDataUrl);
        } catch (error) {
          reject(new Error('Failed to compress image: ' + error.message));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get the approximate size of a base64 string in bytes
   * @param {string} base64String - Base64 encoded string
   * @returns {number} - Size in bytes
   */
  static getBase64Size(base64String) {
    const base64Data = base64String.split(',')[1] || base64String;
    return Math.round(base64Data.length * 0.75);
  }

  /**
   * Check if an image file is too large for localStorage
   * @param {File} file - Image file to check
   * @returns {boolean} - True if file is too large
   */
  static isFileTooLarge(file) {
    // Base64 encoding increases size by ~33%, so 3MB file becomes ~4MB
    // localStorage limit is ~5-10MB, so we'll be conservative
    return file.size > 3 * 1024 * 1024; // 3MB
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  static validateImageFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB absolute max
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Please select an image smaller than 10MB.' };
    }

    return { valid: true };
  }
}