"use client"

import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"

const mockBlogs = [
  {
    id: "BLOG-001",
    title: "Top 10 Tile Trends for 2026",
    slug: "tile-trends-2026",
    status: "Published",
    author: "Admin",
    publishedAt: "2026-01-10T10:00:00Z",
    views: 1234
  },
  {
    id: "BLOG-002",
    title: "How to Choose the Right Tiles for Your Bathroom",
    slug: "choose-bathroom-tiles",
    status: "Draft",
    author: "Admin",
    publishedAt: null,
    views: 0
  },
  {
    id: "BLOG-003",
    title: "Installation Guide: Wood Effect Tiles",
    slug: "wood-effect-installation",
    status: "Published",
    author: "Sales",
    publishedAt: "2026-01-05T14:30:00Z",
    views: 856
  }
]

export default function BlogListPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">Blog Posts</h1>
              <p className="text-muted-foreground mt-1">Create and manage blog content</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Posts ({mockBlogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockBlogs.map((blog) => (
                  <div key={blog.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <h4 className="font-semibold">{blog.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          by {blog.author}
                          {blog.publishedAt && ` • ${new Date(blog.publishedAt).toLocaleDateString()}`}
                          {blog.status === "Published" && ` • ${blog.views} views`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={blog.status === "Published" ? "success" : "secondary"}>
                        {blog.status}
                      </Badge>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
