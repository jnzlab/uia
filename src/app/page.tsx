"use client";
import { useState, useRef, useEffect } from "react";
import { ID } from "./appwrite";
import { Client, Storage } from "appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const storage = new Storage(client);

interface ImageFile {
  $id: string;
  name: string;
  url: string;
}

const GalleryApp = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';

  const handleFileUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      console.error('No file selected');
      return;
    }

    try {
      const file = fileInputRef.current.files[0];
      const response = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
      console.log('Upload successful:', response);
      
      // Add the new image to the gallery
      const fileUrl = storage.getFileView(bucketId, response.$id);
      setImages(prev => [...prev, {
        $id: response.$id,
        name: file.name,
        url: fileUrl.href
      }]);

      // Clear the input field after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const loadImages = async () => {
    try {
      const response = await storage.listFiles(bucketId);
      const loadedImages = await Promise.all(
        response.files.map(file => ({
          $id: file.$id,
          name: file.name,
          url: storage.getFileView(bucketId, file.$id).href
        }))
      );
      setImages(loadedImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Image Gallery
          </h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={handleFileUpload}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Upload Image
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-center text-gray-500">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map(image => (
              <div 
                key={image.$id} 
                className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
              >
                <div className="aspect-square">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-medium text-gray-900">{image.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryApp;
