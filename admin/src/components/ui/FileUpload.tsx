'use client';

import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFileSelect: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function FileUpload({
  accept = "*",
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFileSelect,
  className,
  disabled = false,
  placeholder = "Click to upload or drag and drop"
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length > 0) {
      setError('');
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragOver ? "border-[#1D4ED8] bg-[#EFF4FF]" : "border-[#C7D2DE] hover:border-[#94A3B8]",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-[#F04438] bg-[#FEF3F2]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CloudArrowUpIcon className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
        <p className="text-sm font-medium text-[#0F172A] mb-1">
          {placeholder}
        </p>
        <p className="text-xs text-[#475569]">
          {accept === "*" ? "All files supported" : `Supported: ${accept}`}
          {maxSize && ` • Max ${Math.round(maxSize / 1024 / 1024)}MB`}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {error && (
        <p className="text-sm text-[#B42318]">{error}</p>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#0F172A]">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#F6F8FA] rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-5 w-5 text-[#64748B]" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{file.name}</p>
                  <p className="text-xs text-[#475569]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-[#B42318] hover:text-[#912018] hover:bg-[#FEF3F2]"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}