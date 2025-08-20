import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Image } from "lucide-react";

export const PhotoGallerySection = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 border-b pb-3 mb-2">
        <Camera className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">ფოტო გალერეა</h3>
      </div>

      <div className="rounded-md border border-border p-5 space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">ფოტოების ატვირთვა</h4>
              <p className="text-sm text-muted-foreground mb-4">
                ჩააგდეთ ფოტოები აქ ან დააჭირეთ ატვირთვის ღილაკს
              </p>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <Label htmlFor="photo-upload" asChild>
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  ფოტოების არჩევა
                </Button>
              </Label>
            </div>
          </div>
        </div>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="space-y-4">
            <Label className="font-medium flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span>ატვირთული ფოტოები ({uploadedImages.length})</span>
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={getImagePreview(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h5 className="font-medium mb-2">ფოტოების ატვირთვის რეკომენდაციები:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• გამოიყენეთ მაღალი ხარისხის ფოტოები (მინიმუმ 1200x800 პიქსელი)</li>
            <li>• ატვირთეთ სხვადასხვა კუთხიდან გადაღებული ფოტოები</li>
            <li>• ჩართეთ ყველა ოთახის და მნიშვნელოვანი დეტალის ფოტოები</li>
            <li>• მაქსიმალური ფაილის ზომა: 10MB თითოეული ფოტოსთვის</li>
            <li>• მხარდაჭერილი ფორმატები: JPG, PNG, WebP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};