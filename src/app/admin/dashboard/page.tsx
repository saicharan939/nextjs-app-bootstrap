"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DashboardStats {
  totalNews: number;
  totalVideos: number;
  totalViews: number;
  totalShares: number;
  recentNews: Array<{
    id: string;
    title: string;
    category: string;
    createdAt: string;
    views: number;
  }>;
  recentVideos: Array<{
    id: string;
    title: string;
    youtubeUrl: string;
    createdAt: string;
    views: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Mock data - replace with real API call
    setTimeout(() => {
      setStats({
        totalNews: 156,
        totalVideos: 89,
        totalViews: 45230,
        totalShares: 2340,
        recentNews: [
          {
            id: "1",
            title: "Breaking: Major Economic Policy Changes Announced",
            category: "Politics",
            createdAt: "2024-01-15",
            views: 1250
          },
          {
            id: "2",
            title: "Technology Breakthrough in Renewable Energy",
            category: "Technology",
            createdAt: "2024-01-14",
            views: 890
          },
          {
            id: "3",
            title: "Sports Championship Finals This Weekend",
            category: "Sports",
            createdAt: "2024-01-13",
            views: 2100
          }
        ],
        recentVideos: [
          {
            id: "1",
            title: "Expert Analysis: Market Trends 2024",
            youtubeUrl: "https://youtube.com/watch?v=example1",
            createdAt: "2024-01-15",
            views: 3400
          },
          {
            id: "2",
            title: "Climate Change Documentary Preview",
            youtubeUrl: "https://youtube.com/watch?v=example2",
            createdAt: "2024-01-14",
            views: 2800
          }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
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
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AN</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Abhaya News Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/news")}
              >
                Manage News
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/videos")}
              >
                Manage Videos
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h2>
          <p className="text-slate-600">Monitor your content performance and manage your news platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats?.totalNews}</div>
              <p className="text-xs text-slate-500 mt-1">Published articles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats?.totalVideos}</div>
              <p className="text-xs text-slate-500 mt-1">YouTube videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats?.totalViews.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Across all content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats?.totalShares.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Social media shares</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent News */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent News</CardTitle>
              <CardDescription>Latest published articles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.recentNews.map((news) => (
                <div key={news.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm mb-1">{news.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Badge variant="secondary" className="text-xs">{news.category}</Badge>
                      <span>•</span>
                      <span>{news.createdAt}</span>
                      <span>•</span>
                      <span>{news.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/news")}
              >
                View All News
              </Button>
            </CardContent>
          </Card>

          {/* Recent Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Videos</CardTitle>
              <CardDescription>Latest YouTube videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.recentVideos.map((video) => (
                <div key={video.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm mb-1">{video.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>{video.createdAt}</span>
                      <span>•</span>
                      <span>{video.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/videos")}
              >
                View All Videos
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
