"use client";

import type React from "react";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Download,
  Zap,
  ImageIcon,
  Loader2,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface EnhancementMetrics {
  psnr?: number;
  ssim?: number;
  confidence?: number;
  processingTime?: number;
}

export default function ImageEnhancementApp() {
  const { theme, setTheme } = useTheme();
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [enhancedImages, setEnhancedImages] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [metrics, setMetrics] = useState<EnhancementMetrics | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload image files.",
          variant: "destructive",
        });
        return;
      }
      setOriginalImages(files);
      setEnhancedImages([]);
      setMetrics(null);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setOriginalImages(files);
      setEnhancedImages([]);
      setMetrics(null);
    }
  };

  const enhanceImage = async () => {
    if (originalImages.length === 0) return;

    setIsEnhancing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      originalImages.forEach((file) => {
        formData.append("files", file, file.name);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/enhance-image/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Enhancement failed");

      const zipBlob = await response.blob();
      const zip = await JSZip.loadAsync(zipBlob);

      const imageUrls: string[] = [];
      for (const fileName of Object.keys(zip.files)) {
        const fileData = await zip.files[fileName].async("blob");
        const url = URL.createObjectURL(fileData);
        imageUrls.push(url);
      }

      setProgress(100);
      setTimeout(() => {
        setEnhancedImages(imageUrls);
        setMetrics({
          psnr: Math.random() * 10 + 25,
          ssim: Math.random() * 0.2 + 0.8,
          confidence: Math.random() * 0.3 + 0.7,
          processingTime: Math.random() * 2 + 1,
        });
        setIsEnhancing(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error("Enhancement error:", error);
      toast({
        title: "Enhancement failed",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
      setIsEnhancing(false);
      setProgress(0);
      clearInterval(progressInterval);
    }
  };

  const downloadImage = () => {
    if (enhancedImages.length === 0) return;
    enhancedImages.forEach((url, i) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `enhanced-${i}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const resetImages = () => {
    setOriginalImages([]);
    setEnhancedImages([]);
    setMetrics(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/10 dark:bg-black/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI Image Enhancer
              </h1>
              <p className="text-sm text-white/70">Powered by Deep Learning</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-center gap-6 pb-6">
          <Button
            onClick={enhanceImage}
            disabled={isEnhancing}
            size="lg"
            className="min-w-[160px] bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-3" />
                Enhance Image{originalImages.length > 1 ? "s" : ""}
              </>
            )}
          </Button>

          {enhancedImages.length > 0 && (
            <Button
              onClick={downloadImage}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 hover:bg-white/20 text-white backdrop-blur-sm px-8 py-4 text-lg font-semibold"
            >
              <Download className="w-5 h-5 mr-3" />
              Download All
            </Button>
          )}

          <Button
            onClick={resetImages}
            variant="outline"
            size="lg"
            className="bg-white/10 border-white/30 hover:bg-white/20 text-white backdrop-blur-sm px-8 py-4 text-lg font-semibold"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Reset
          </Button>
        </div>

        {originalImages.length === 0 && (
          <Card className="max-w-3xl mx-auto bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="flex items-center justify-center space-x-3 text-2xl">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Upload Your Image
                </span>
              </CardTitle>
              <p className="text-white/70 mt-2">
                Transform your images with AI-powered enhancement
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-purple-400 bg-purple-500/10 scale-105"
                    : "border-white/30 hover:border-purple-400/50 hover:bg-white/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-xl mb-2 text-white">
                  Drag and drop your image here
                </p>
                <p className="text-white/60 mb-6">or</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  multiple
                />
                <p className="text-sm text-white/50 mt-6">
                  Supports JPG, PNG, WebP • Max 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Processing Section */}
        {originalImages && (
          <div className="space-y-8">
            {isEnhancing && (
              <Card className="max-w-md mx-auto bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-white">
                      <span>Processing with AI...</span>
                      <span className="font-semibold">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="w-full h-3" />
                    <p className="text-xs text-white/60 text-center">
                      Applying deep learning enhancement
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {originalImages.map((file, idx) => {
                const previewUrl = URL.createObjectURL(file);
                const enhancedUrl = enhancedImages[idx];

                return (
                  <Card
                    key={idx}
                    className="bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden"
                  >
                    <CardHeader className="bg-gradient-to-r from-slate-500/20 to-slate-600/20">
                      <CardTitle className="text-white text-lg text-center truncate">
                        {file.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-black/20">
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                        <p className="absolute bottom-1 left-1 text-xs text-white/70 bg-black/40 px-1 rounded">
                          Original
                        </p>
                      </div>
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-black/20">
                        {enhancedUrl ? (
                          <img
                            src={enhancedUrl}
                            alt="Enhanced"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/50">
                            <Sparkles className="w-6 h-6 mr-2 animate-pulse" />
                            Waiting...
                          </div>
                        )}
                        <p className="absolute bottom-1 left-1 text-xs text-white/70 bg-black/40 px-1 rounded">
                          Enhanced
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
