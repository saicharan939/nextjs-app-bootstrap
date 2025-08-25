"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoEntry {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  shares: number;
  status: "published" | "draft";
  duration: string;
}

export default function VideoManagement() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null);
  const router = useRouter();

  const categories = ["News", "Analysis", "Interview", "Documentary", "Live", "Entertainment"];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Mock data - replace with real API call
    setTimeout(() => {
      const mockVideos: VideoEntry[] = [
        {
          id: "1",
          title: "Expert Analysis: Market Trends 2024",
          description: "Comprehensive analysis of current market trends and future predictions for 2024.",
          youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
          youtubeId: "dQw4w9WgXcQ",
          thumbnailUrl: "https://placehold.co/480x360?text=Market+Trends+2024+Expert+Analysis+Video",
          category: "Analysis",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
          views: 3400,
          shares: 156,
          status: "published",
          duration: "15:42"
        },
        {
          id: "2",
          title: "Climate Change Documentary Preview",
          description: "Preview of upcoming documentary on climate change impacts and solutions.",
          youtubeUrl: "https://youtube.com/watch?v=example2",
          youtubeId: "example2",
          thumbnailUrl: "https://placehold.co/480x360?text=Climate+Change+Documentary+Preview+Video",
          category: "Documentary",
          createdAt: "2024-01-14T15:45:00Z",
          updatedAt: "2024-01-14T15:45:00Z",
          views: 2800,
          shares: 234,
          status: "published",
          duration: "8:23"
        },
        {
          id: "3",
          title: "Live: Breaking News Coverage",
          description: "Live coverage of breaking news events with real-time updates.",
          youtubeUrl: "https://youtube.com/watch?v=example3",
          youtubeId: "example3",
          thumbnailUrl: "https://placehold.co/480x360?text=Live+Breaking+News+Coverage+Stream",
          category: "Live",
          createdAt: "2024-01-13T09:15:00Z",
          updatedAt: "2024-01-13T09:15:00Z",
          views: 5600,
          shares: 445,
          status: "published",
          duration: "45:12"
        },
        {
          id: "4",
          title: "Interview with Tech Industry Leader",
          description: "Exclusive interview discussing future of technology and innovation.",
          youtubeUrl: "https://youtube.com/watch?v=example4",
          youtubeId: "example4",
          thumbnailUrl: "https://placehold.co/480x360?text=Tech+Industry+Leader+Interview+Video",
          category: "Interview",
          createdAt: "2024-01-12T14:20:00Z",
          updatedAt: "2024-01-12T14:20:00Z",
          views: 1200,
          shares: 89,
          status: "draft",
          duration: "22:35"
        }
      ];
      setVideos(mockVideos);
      setFilteredVideos(mockVideos);
      setIsLoading(false);
    }, 1000);
  }, [router]);

  useEffect(() => {
    let filtered = videos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(video => video.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(video => video.status === statusFilter);
    }

    setFilteredVideos(filtered);
  }, [videos, searchTerm, categoryFilter, statusFilter]);

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
    setDeleteAlert("Video deleted successfully");
    setTimeout(() => setDeleteAlert(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/dashboard")}
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-slate-900">Video Management</h1>
            </div>
            <Button
              onClick={() => router.push("/admin/videos/add")}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Add New Video
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deleteAlert && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {deleteAlert}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-slate-500">No videos found matching your criteria.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={video.thumbnailUrl}
                    alt={`Video thumbnail for ${video.title}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/480x360?text=Video+Thumbnail+Not+Available";
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={video.status === "published" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {video.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-slate-600 text-xs line-clamp-2">
                        {video.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <Badge variant="outline" className="text-xs">
                        {video.category}
                      </Badge>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{video.views.toLocaleString()} views</span>
                      <span>{video.shares} shares</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => window.open(video.youtubeUrl, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => router.push(`/admin/videos/edit/${video.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleDelete(video.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Showing {filteredVideos.length} of {videos.length} videos</span>
              <span>
                {videos.filter(v => v.status === "published").length} published, {" "}
                {videos.filter(v => v.status === "draft").length} drafts
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
