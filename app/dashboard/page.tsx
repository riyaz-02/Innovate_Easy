"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Plus, Layers, CheckCircle, Clock, BookOpen } from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: "pending" | "completed";
  created_at: string;
}

interface ResearchPaper {
  id: number;
  title: string;
  status: "unpublished" | "published";
  created_at: string;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          console.log("No user logged in, redirecting to login");
          router.push("/login");
          return;
        }

        const name = user.user_metadata?.name || "User";
        setUserName(name);
        console.log("Logged-in User:", { id: user.id, name });

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, name, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch research papers
        const { data: papersData, error: papersError } = await supabase
          .from("research_papers")
          .select("id, title, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (papersError) throw papersError;
        setResearchPapers(papersData || []);
      } catch (error) {
        console.error("Data Fetch Error:", error);
        router.push("/login"); // Redirect on critical errors
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (!userName) {
    return null; // Redirecting via useEffect
  }

  // Calculate stats
  const totalProjects = projects.length;
  const totalResearchPapers = researchPapers.length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const completedPapers = researchPapers.filter((r) => r.status === "published").length;
  const inProgressProjects = totalProjects - completedProjects;
  const inProgressPapers = totalResearchPapers - completedPapers;

  // Get recent items (last 3)
  const recentProjects = projects.slice(0, 3);
  const recentPapers = researchPapers.slice(0, 3);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your projects and research papers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">{completedProjects} completed</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResearchPapers}</div>
            <p className="text-xs text-muted-foreground">{completedPapers} published</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20 dark:bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects + completedPapers}</div>
            <p className="text-xs text-muted-foreground">{completedProjects} projects, {completedPapers} papers</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProjects + inProgressPapers}</div>
            <p className="text-xs text-muted-foreground">{inProgressProjects} projects, {inProgressPapers} papers</p>
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
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-blue-500/10 p-2">
                        <Layers className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {project.status === "completed" ? "Completed" : "In Progress"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent projects.</p>
              )}
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
              {recentPapers.length > 0 ? (
                recentPapers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-purple-500/10 p-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">{paper.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(paper.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {paper.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent research papers.</p>
              )}
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
  );
}