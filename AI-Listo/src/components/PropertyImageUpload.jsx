import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { FiUploadCloud, FiImage } from 'react-icons/fi';
import './PropertyImageUpload.css';

/**
 * Modern image upload dropzone for property edit form.
 * Uses react-dropzone for drag-and-drop and click-to-browse.
 */
export default function PropertyImageUpload({
  onUpload,
  onSuccess,
  onError,
  uploading,
  disabled,
  maxFiles,
  currentCount = 0,
}) {
  const { t } = useTranslation();
  const canUpload = !disabled && !uploading && currentCount < maxFiles;

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      if (currentCount >= maxFiles) {
        onError?.(t('properties.maxImagesReached', { max: maxFiles }));
        return;
      }
      const slotsLeft = maxFiles - currentCount;
      const filesToUpload = acceptedFiles.slice(0, slotsLeft);
      try {
        await onUpload(filesToUpload);
        onSuccess?.(filesToUpload.length);
      } catch (err) {
        onError?.(err.message || t('properties.uploadFailed'));
      }
    },
    [onUpload, onSuccess, onError, maxFiles, currentCount, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: Math.max(1, maxFiles - currentCount),
    disabled: !canUpload,
    noClick: !canUpload,
    noKeyboard: !canUpload,
  });

  return (
    <div
      {...getRootProps()}
      className={`property-image-dropzone ${isDragActive ? 'property-image-dropzone--active' : ''} ${
        !canUpload ? 'property-image-dropzone--disabled' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div className="property-image-dropzone__content">
        {uploading ? (
          <>
            <FiUploadCloud className="property-image-dropzone__icon property-image-dropzone__icon--spin" />
            <span className="property-image-dropzone__text">{t('properties.uploading')}</span>
          </>
        ) : !canUpload && currentCount >= maxFiles ? (
          <>
            <FiImage className="property-image-dropzone__icon" />
            <span className="property-image-dropzone__text">{t('properties.maxReached')}</span>
          </>
        ) : (
          <>
            <FiUploadCloud className="property-image-dropzone__icon" />
            <span className="property-image-dropzone__text">
              {isDragActive
                ? t('properties.dropImagesHere')
                : t('properties.dragDropOrClick')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
