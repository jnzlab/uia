"use client";
import { useState, useRef, useEffect } from "react";
import { ID } from "./appwrite";
import { Client, Storage } from "appwrite";
import Image from "next/image";

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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';

  const handleFileUpload = async () => {
    if (isUploading) return;
    
    if (!fileInputRef.current?.files?.[0]) {
      console.error('No file selected');
      return;
    }

    const file = fileInputRef.current.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (e.g., 5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
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

      // Clear the input field and selected filename after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        setSelectedFileName('');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName('');
    }
  };

  const clearSelectedFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setSelectedFileName('');
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
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              {selectedFileName && (
                <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm text-gray-600">{selectedFileName}</span>
                  <button
                    onClick={clearSelectedFile}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={handleFileUpload}
              disabled={isUploading || !selectedFileName}
              className={`inline-flex items-center justify-center rounded-lg ${
                isUploading || !selectedFileName ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              } px-6 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto`}
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
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
                <div className="aspect-square relative">
                  <Image 
                    src={image.url} 
                    alt={image.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
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
