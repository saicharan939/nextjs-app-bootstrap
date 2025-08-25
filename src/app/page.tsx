"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to admin login after 3 seconds
    const timer = setTimeout(() => {
      router.push("/admin/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">AN</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Abhaya News & Video
          </CardTitle>
          <CardDescription className="text-white/80">
            Admin Content Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-white/70 text-sm">
            Redirecting to admin panel in 3 seconds...
          </p>
          <Button 
            onClick={() => router.push("/admin/login")}
            className="w-full bg-white text-slate-900 hover:bg-white/90"
          >
            Go to Admin Panel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
