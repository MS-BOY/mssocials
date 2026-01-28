
/**
 * Cloudinary Configuration
 */
const CLOUDINARY_UPLOAD_PRESET = "birthday_image";
const CLOUDINARY_CLOUD_NAME = "msboy";

export const uploadToCloudinary = async (
  file: File | Blob | string, 
  resourceType: "image" | "video" | "raw" = "image",
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        const errorData = JSON.parse(xhr.responseText);
        reject(new Error(errorData.error?.message || `Failed to upload ${resourceType} to Cloudinary`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(formData);
  });
};

const getPublicIdFromUrl = (url: string) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.split('.')[0];
};

export const deleteFromCloudinary = async (url: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> => {
  const publicId = getPublicIdFromUrl(url);
  try {
    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error("Cloudinary purge failed:", error);
  }
};
