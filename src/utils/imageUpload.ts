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

import { LeaveAttachment } from '../types';

export function processLeaveAttachmentFile(file: File): Promise<LeaveAttachment> {
  return new Promise((resolve, reject) => {
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      reject(new Error('Only PDF or Image files (JPG, PNG, WebP) are supported.'));
      return;
    }

    if (isPdf) {
      if (file.size > 3 * 1024 * 1024) {
        reject(new Error('PDF file is too large for browser storage (max 3MB).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read PDF file.'));
      reader.onload = () => {
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: 'application/pdf',
          kind: 'pdf',
          dataUrl: reader.result as string,
          sizeBytes: file.size,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Image file: compress keeping aspect ratio (max 1280px) so documents/medical slips remain legible
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Image file is too large (max 15MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            kind: 'image',
            dataUrl,
            sizeBytes: file.size,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: 'image/jpeg',
          kind: 'image',
          dataUrl: compressed,
          sizeBytes: Math.round((compressed.length * 3) / 4),
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function processLogoImageFile(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP, SVG).'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Logo image is too large (max 10MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read logo file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load logo preview.'));
      img.onload = () => {
        let width = img.width || maxSize;
        let height = img.height || maxSize;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function processBannerImageFile(file: File, maxWidth = 1440): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP).'));
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
        let width = img.width || maxWidth;
        let height = img.height || 320;
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
