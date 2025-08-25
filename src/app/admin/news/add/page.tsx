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

interface NewsFormData {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  status: "published" | "draft";
}

export default function AddNews() {
  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    summary: "",
    content: "",
    category: "",
    imageUrl: "",
    status: "draft"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const categories = ["Politics", "Technology", "Sports", "Entertainment", "Business", "Health"];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
  }, [router]);

  const handleInputChange = (field: keyof NewsFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      setIsLoading(false);
      return;
    }
    if (!formData.summary.trim()) {
      setError("Summary is required");
      setIsLoading(false);
      return;
    }
    if (!formData.content.trim()) {
      setError("Content is required");
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
      const newArticle = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        shares: 0
      };

      console.log("New article created:", newArticle);
      setSuccess("Article created successfully!");
      
      // Redirect after success
      setTimeout(() => {
        router.push("/admin/news");
      }, 2000);

    } catch (err) {
      setError("Failed to create article. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageUrl = () => {
    if (formData.title) {
      const encodedTitle = encodeURIComponent(formData.title.replace(/\s+/g, '+'));
      const imageUrl = `https://placehold.co/800x600?text=${encodedTitle}+News+Article`;
      setFormData(prev => ({ ...prev, imageUrl }));
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
                onClick={() => router.push("/admin/news")}
              >
                ← Back to News
              </Button>
              <h1 className="text-xl font-bold text-slate-900">Add New Article</h1>
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the main details of your news article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Article Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter article title"
                  className="mt-1"
                  maxLength={200}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => handleInputChange("summary", e.target.value)}
                  placeholder="Brief summary of the article"
                  className="mt-1"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.summary.length}/500 characters
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

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>Write the full content of your article</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Write your article content here..."
                  className="mt-1 min-h-[300px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.content.length} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>Add an image to accompany your article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="Enter image URL or generate from title"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateImageUrl}
                    disabled={!formData.title}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {formData.imageUrl && (
                <div className="mt-4">
                  <Label>Image Preview</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt={`Preview image for ${formData.title || 'news article'}`}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/800x600?text=Image+Preview+Not+Available";
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>Choose how to publish this article</CardDescription>
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
                  ? "Article will be visible to users immediately" 
                  : "Article will be saved as draft and can be published later"
                }
              </p>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/news")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? "Creating..." : "Create Article"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
