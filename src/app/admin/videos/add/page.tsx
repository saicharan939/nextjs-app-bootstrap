"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface VideoFormData {
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  category: string;
  status: "published" | "draft";
  duration: string;
}

export default function AddVideo() {
  const [formData, setFormData] = useState<VideoFormData>({
    title: "",
    description: "",
    youtubeUrl: "",
    youtubeId: "",
    thumbnailUrl: "",
    category: "",
    status: "draft",
    duration: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const categories = ["News", "Analysis", "Interview", "Documentary", "Live", "Entertainment"];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
  }, [router]);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchVideoDetails = async (youtubeUrl: string) => {
    setIsFetching(true);
    setError("");

    try {
      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        setError("Invalid YouTube URL. Please enter a valid YouTube video URL.");
        setIsFetching(false);
        return;
      }

      // Mock API call to fetch video details
      // In real implementation, use YouTube Data API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock video data based on URL
      const mockVideoData = {
        title: "Sample Video Title from YouTube",
        description: "This is a sample description fetched from YouTube API. In real implementation, this would contain the actual video description.",
        youtubeId,
        thumbnailUrl: `https://placehold.co/480x360?text=YouTube+Video+Thumbnail+${youtubeId}`,
        duration: "12:34"
      };

      setFormData(prev => ({
        ...prev,
        youtubeUrl,
        youtubeId: mockVideoData.youtubeId,
        title: mockVideoData.title,
        description: mockVideoData.description,
        thumbnailUrl: mockVideoData.thumbnailUrl,
        duration: mockVideoData.duration
      }));

    } catch (err) {
      setError("Failed to fetch video details. Please check the URL and try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (field: keyof VideoFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleYouTubeUrlChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      youtubeUrl: url,
      // Clear auto-fetched data when URL changes
      youtubeId: "",
      title: "",
      description: "",
      thumbnailUrl: "",
      duration: ""
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.youtubeUrl.trim()) {
      setError("YouTube URL is required");
      setIsLoading(false);
      return;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      setIsLoading(false);
      return;
    }
    if (!formData.category) {
      setError("Category is required");
      setIsLoading(false);
      return;
    }

    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success
      const newVideo = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        shares: 0
      };

      console.log("New video created:", newVideo);
      setSuccess("Video added successfully!");
      
      // Redirect after success
      setTimeout(() => {
        router.push("/admin/videos");
      }, 2000);

    } catch (err) {
      setError("Failed to add video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/videos")}
              >
                ← Back to Videos
              </Button>
              <h1 className="text-xl font-bold text-slate-900">Add New Video</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL */}
          <Card>
            <CardHeader>
              <CardTitle>YouTube Video</CardTitle>
              <CardDescription>Enter the YouTube URL to automatically fetch video details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtubeUrl">YouTube URL *</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchVideoDetails(formData.youtubeUrl)}
                    disabled={!formData.youtubeUrl || isFetching}
                  >
                    {isFetching ? "Fetching..." : "Fetch Details"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
                </p>
              </div>

              {formData.thumbnailUrl && (
                <div>
                  <Label>Video Preview</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={formData.thumbnailUrl}
                      alt={`Video thumbnail for ${formData.title || 'YouTube video'}`}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/480x360?text=Video+Thumbnail+Not+Available";
                      }}
                    />
                    {formData.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formData.duration}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Details */}
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
              <CardDescription>Edit the video details or add custom information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter video title"
                  className="mt-1"
                  maxLength={200}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Video description"
                  className="mt-1"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>Additional settings for the video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="thumbnailUrl">Custom Thumbnail URL (Optional)</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => handleInputChange("thumbnailUrl", e.target.value)}
                  placeholder="Override auto-fetched thumbnail"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to use auto-fetched thumbnail
                </p>
              </div>

              <div>
                <Label htmlFor="duration">Duration (Optional)</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 12:34"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Format: MM:SS or HH:MM:SS
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>Choose how to publish this video</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="publish"
                  checked={formData.status === "published"}
                  onCheckedChange={(checked) => 
                    handleInputChange("status", checked ? "published" : "draft")
                  }
                />
                <Label htmlFor="publish">
                  {formData.status === "published" ? "Publish immediately" : "Save as draft"}
                </Label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {formData.status === "published" 
                  ? "Video will be visible to users immediately" 
                  : "Video will be saved as draft and can be published later"
                }
              </p>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/videos")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? "Adding..." : "Add Video"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
