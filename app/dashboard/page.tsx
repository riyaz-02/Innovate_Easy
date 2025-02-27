import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Layers, CheckCircle, Clock, BookOpen } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, John Doe!</h1>
        <p className="text-muted-foreground">Here's an overview of your projects and research papers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20 dark:bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">5 projects, 2 papers</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">7 projects, 6 papers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 border-blue-500/20">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your most recent projects and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Project {i}</p>
                      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      In Progress
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/projects">
              <Button variant="outline" size="sm">
                View All Projects
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="col-span-1 border-purple-500/20">
          <CardHeader>
            <CardTitle>Recent Research Papers</CardTitle>
            <CardDescription>Your most recent research papers and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-purple-500/10 p-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">Research Paper {i}</p>
                      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      Draft
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/research">
              <Button variant="outline" size="sm">
                View All Papers
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Create new projects or research papers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Research Paper
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

