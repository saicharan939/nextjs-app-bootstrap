"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  shares: number;
  status: "published" | "draft";
}

export default function NewsManagement() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null);
  const router = useRouter();

  const categories = ["Politics", "Technology", "Sports", "Entertainment", "Business", "Health"];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Mock data - replace with real API call
    setTimeout(() => {
      const mockNews: NewsArticle[] = [
        {
          id: "1",
          title: "Breaking: Major Economic Policy Changes Announced",
          summary: "Government announces significant changes to economic policies affecting multiple sectors.",
          content: "Full article content here...",
          category: "Politics",
          imageUrl: "https://placehold.co/400x300?text=Economic+Policy+News+Article+Image",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
          views: 1250,
          shares: 89,
          status: "published"
        },
        {
          id: "2",
          title: "Technology Breakthrough in Renewable Energy",
          summary: "Scientists develop new solar panel technology with 40% higher efficiency.",
          content: "Full article content here...",
          category: "Technology",
          imageUrl: "https://placehold.co/400x300?text=Renewable+Energy+Technology+Breakthrough",
          createdAt: "2024-01-14T15:45:00Z",
          updatedAt: "2024-01-14T15:45:00Z",
          views: 890,
          shares: 156,
          status: "published"
        },
        {
          id: "3",
          title: "Sports Championship Finals This Weekend",
          summary: "Two top teams prepare for the ultimate showdown in this year's championship.",
          content: "Full article content here...",
          category: "Sports",
          imageUrl: "https://placehold.co/400x300?text=Sports+Championship+Finals+Coverage",
          createdAt: "2024-01-13T09:15:00Z",
          updatedAt: "2024-01-13T09:15:00Z",
          views: 2100,
          shares: 234,
          status: "published"
        },
        {
          id: "4",
          title: "New Healthcare Initiative Launched",
          summary: "Government launches comprehensive healthcare program for rural areas.",
          content: "Full article content here...",
          category: "Health",
          imageUrl: "https://placehold.co/400x300?text=Healthcare+Initiative+Program+Launch",
          createdAt: "2024-01-12T14:20:00Z",
          updatedAt: "2024-01-12T14:20:00Z",
          views: 567,
          shares: 78,
          status: "draft"
        }
      ];
      setNews(mockNews);
      setFilteredNews(mockNews);
      setIsLoading(false);
    }, 1000);
  }, [router]);

  useEffect(() => {
    let filtered = news;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(article => article.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(article => article.status === statusFilter);
    }

    setFilteredNews(filtered);
  }, [news, searchTerm, categoryFilter, statusFilter]);

  const handleDelete = (id: string) => {
    setNews(prev => prev.filter(article => article.id !== id));
    setDeleteAlert("Article deleted successfully");
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
          <p className="mt-4 text-slate-600">Loading news articles...</p>
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
              <h1 className="text-xl font-bold text-slate-900">News Management</h1>
            </div>
            <Button
              onClick={() => router.push("/admin/news/add")}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Add New Article
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
            <CardTitle className="text-lg">Filter Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search articles..."
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

        {/* Articles List */}
        <div className="space-y-4">
          {filteredNews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No articles found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredNews.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={article.imageUrl}
                      alt={`News article image for ${article.title}`}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/400x300?text=News+Image+Placeholder";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {article.title}
                          </h3>
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {article.summary}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <Badge
                              variant={article.status === "published" ? "default" : "secondary"}
                            >
                              {article.status}
                            </Badge>
                            <Badge variant="outline">{article.category}</Badge>
                            <span>{formatDate(article.createdAt)}</span>
                            <span>{article.views} views</span>
                            <span>{article.shares} shares</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/news/edit/${article.id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
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
              <span>Showing {filteredNews.length} of {news.length} articles</span>
              <span>
                {news.filter(a => a.status === "published").length} published, {" "}
                {news.filter(a => a.status === "draft").length} drafts
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
