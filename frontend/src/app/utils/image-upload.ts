/** Matches backend MAX_FILE_SIZE (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;

export const ACCEPTED_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp';

export const IMAGE_UPLOAD_HINT = 'JPEG, PNG, GIF or WebP · max 5 MB';

export function validateImageFile(file: File | null | undefined): string | null {
  if (!file) return 'Image file is required';
  const type = (file.type || '').toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Only JPEG, PNG, GIF, or WebP images are allowed';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 5 MB or smaller';
  }
  return null;
}

/** Read the selected file from an input change event and clear the input. */
export function fileFromInputEvent(event: Event): File | null {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = '';
  return file;
}
