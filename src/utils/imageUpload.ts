export function processProfilePhotoFile(file: File, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('Image file is too large (max 12MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image preview.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Center-crop square and resize to maxSize x maxSize for crisp avatar & low storage footprint
        const minDim = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minDim) / 2);
        const sy = Math.floor((img.height - minDim) / 2);
        const target = Math.min(maxSize, minDim);

        canvas.width = target;
        canvas.height = target;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, target, target);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
