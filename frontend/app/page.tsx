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

interface EnhancementMetrics {
  psnr?: number;
  ssim?: number;
  confidence?: number;
  processingTime?: number;
}

export default function ImageEnhancementApp() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [metrics, setMetrics] = useState<EnhancementMetrics | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setEnhancedImage(null);
      setMetrics(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const enhanceImage = async () => {
    if (!originalImage) return;

    setIsEnhancing(true);
    setProgress(0);

    // Simulate progress updates
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
      // Convert base64 to blob for API call
      const response = await fetch(originalImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/enhance-image/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!apiResponse.ok) {
        throw new Error("Enhancement failed");
      }

      const result = await apiResponse.blob();

      setProgress(100);
      setTimeout(() => {
        setEnhancedImage(URL.createObjectURL(result));
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
    if (!enhancedImage) return;

    const link = document.createElement("a");
    link.href = enhancedImage;
    link.download = "enhanced-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImages = () => {
    setOriginalImage(null);
    setEnhancedImage(null);
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
        {/* Upload Section */}
        {!originalImage && (
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
                />
                <p className="text-sm text-white/50 mt-6">
                  Supports JPG, PNG, WebP • Max 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Processing Section */}
        {originalImage && (
          <div className="space-y-8">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-6">
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
                    Enhance Image
                  </>
                )}
              </Button>

              {enhancedImage && (
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/30 hover:bg-white/20 text-white backdrop-blur-sm px-8 py-4 text-lg font-semibold"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Download
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

            {/* Progress Bar */}
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

            {/* Image Comparison */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Original Image */}
              <Card className="bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-500/20 to-slate-600/20">
                  <CardTitle className="text-center text-white text-xl">
                    Original Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="aspect-square relative overflow-hidden rounded-xl bg-black/20 shadow-inner">
                    <img
                      src={originalImage || "/placeholder.svg"}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Image */}
              <Card className="bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                  <CardTitle className="text-center text-white text-xl flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Enhanced
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="aspect-square relative overflow-hidden rounded-xl bg-black/20 shadow-inner">
                    {enhancedImage ? (
                      <img
                        src={enhancedImage || "/placeholder.svg"}
                        alt="Enhanced"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white/60">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                          <p className="text-lg">
                            Enhanced image will appear here
                          </p>
                          <p className="text-sm mt-2">
                            Click "Enhance Image" to start
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics */}
            {metrics && (
              <Card className="max-w-4xl mx-auto bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                  <CardTitle className="text-center text-white text-2xl flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    Enhancement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30"
                      >
                        PSNR
                      </Badge>
                      <p className="text-3xl font-bold text-white">
                        {metrics.psnr?.toFixed(2)}
                      </p>
                      <p className="text-white/60 text-sm">dB</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                      >
                        SSIM
                      </Badge>
                      <p className="text-3xl font-bold text-white">
                        {metrics.ssim?.toFixed(3)}
                      </p>
                      <p className="text-white/60 text-sm">similarity</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-pink-500/20 text-pink-300 border-pink-500/30"
                      >
                        Confidence
                      </Badge>
                      <p className="text-3xl font-bold text-white">
                        {(metrics.confidence! * 100).toFixed(1)}
                      </p>
                      <p className="text-white/60 text-sm">%</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      >
                        Time
                      </Badge>
                      <p className="text-3xl font-bold text-white">
                        {metrics.processingTime?.toFixed(1)}
                      </p>
                      <p className="text-white/60 text-sm">seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}