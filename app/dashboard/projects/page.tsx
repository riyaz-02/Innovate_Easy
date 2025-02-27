"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { CheckCircle, Clock, MoreHorizontal, Plus, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: number;
  name: string;
  description: string;
  status: "pending" | "completed";
  created_at: string;
  estimated_time?: number; // Optional, in days
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Array of colors for project cards
  const cardColors = [
    { bg: "bg-blue-500/10", border: "border-blue-500/20", progress: "bg-blue-500" },
    { bg: "bg-purple-500/10", border: "border-purple-500/20", progress: "bg-purple-500" },
    { bg: "bg-green-500/10", border: "border-green-500/20", progress: "bg-green-500" },
    { bg: "bg-amber-500/10", border: "border-amber-500/20", progress: "bg-amber-500" },
    { bg: "bg-pink-500/10", border: "border-pink-500/20", progress: "bg-pink-500" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/20", progress: "bg-indigo-500" },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          console.log("No user logged in, redirecting to login");
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("projects")
          .select("id, name, description, status, created_at, estimated_time")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
        console.log("Fetched Projects:", data);
      } catch (error) {
        console.error("Projects Fetch Error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track their progress.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p>No projects found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => {
            const colorIndex = i % cardColors.length;
            const colors = cardColors[colorIndex];

            // Calculate remaining days (simplified: assumes estimated_time is total duration)
            const createdDate = new Date(project.created_at);
            const now = new Date();
            const daysSinceCreation = Math.floor(
              (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysLeft = project.estimated_time
              ? Math.max(0, project.estimated_time - daysSinceCreation)
              : "N/A";

            // Progress: 100% if completed, otherwise estimate based on time (or add a progress field later)
            const progress = project.status === "completed"
              ? 100
              : project.estimated_time
              ? Math.min(90, Math.floor((daysSinceCreation / project.estimated_time) * 100))
              : 50;

            return (
              <Card key={project.id} className={`overflow-hidden ${colors.bg} ${colors.border}`}>
                <CardHeader className="p-0">
                  <div className={`h-3 ${colors.progress}`} />
                  <div className="p-6 pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle>{project.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="mt-2">
                      {project.description || "No description available."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {daysLeft !== "N/A" ? `${daysLeft} days left` : "No estimate"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {project.status === "completed" ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                            In Progress
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium">Progress</div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${colors.progress}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-6 pt-0">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <CheckCircle className="h-4 w-4" />
                      <span className="sr-only">Mark as complete</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}