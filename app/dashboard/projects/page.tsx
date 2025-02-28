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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: number;
  name: string;
  description: string;
  status: "pending" | "completed";
  created_at: string;
  estimated_duration: string;
}

interface RoadmapStep {
  id: number;
  project_id: number;
  status: "pending" | "completed";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [roadmapSteps, setRoadmapSteps] = useState<{ [key: number]: RoadmapStep[] }>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const router = useRouter();

  const cardColors = [
    { bg: "bg-blue-500/10", border: "border-blue-500/20", progress: "bg-blue-500" },
    { bg: "bg-purple-500/10", border: "border-purple-500/20", progress: "bg-purple-500" },
    { bg: "bg-green-500/10", border: "border-green-500/20", progress: "bg-green-500" },
    { bg: "bg-amber-500/10", border: "border-amber-500/20", progress: "bg-amber-500" },
    { bg: "bg-pink-500/10", border: "border-pink-500/20", progress: "bg-pink-500" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/20", progress: "bg-indigo-500" },
  ];

  useEffect(() => {
    const fetchProjectsAndSteps = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          console.log("No user logged in, redirecting to login");
          router.push("/login");
          return;
        }

        // Fetch projects
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, description, status, created_at, estimated_duration")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (projectError) throw projectError;
        setProjects(projectData || []);

        // Fetch roadmap steps for each project
        for (const project of projectData || []) {
          const { data: stepsData, error: stepsError } = await supabase
            .from("roadmap_steps")
            .select("id, project_id, status")
            .eq("project_id", project.id);

          if (stepsError) throw stepsError;
          setRoadmapSteps((prev) => ({
            ...prev,
            [project.id]: stepsData || [],
          }));
        }

        console.log("Fetched Projects:", projectData);
      } catch (error) {
        console.error("Projects Fetch Error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndSteps();
  }, [router]);

  const handleMarkAsComplete = async (projectId: number) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, status: "completed" } : project
        )
      );
      setCompleteDialogOpen(false);
    } catch (error) {
      console.error("Error marking project as complete:", error);
      alert("Failed to mark project as complete. Please try again.");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);

      if (error) throw error;

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

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

            const createdDate = new Date(project.created_at);
            const formattedDate = createdDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const steps = roadmapSteps[project.id] || [];
            const totalSteps = steps.length;
            const completedSteps = steps.filter((step) => step.status === "completed").length;
            const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

            const now = new Date();
            const daysSinceCreation = Math.floor(
              (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysLeft = project.estimated_duration
              ? Math.floor(Math.max(0, parseInt(project.estimated_duration) - daysSinceCreation))
              : "N/A";

            return (
              <Card
                key={project.id}
                className={`overflow-hidden ${colors.bg} ${colors.border} h-[450px] flex flex-col`}
              >
                <CardHeader className="p-0 flex-grow">
                  <div className={`h-3 ${colors.progress}`} />
                  <div className="p-6 pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                        {project.name}
                      </CardTitle>
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
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedProjectId(project.id);
                              setCompleteDialogOpen(true);
                            }}
                          >
                            Mark as Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => {
                              setSelectedProjectId(project.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {project.description || "No description available."}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      Created: {formattedDate}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-grow">
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
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${colors.progress}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="mr-4" // Added margin-right for gap
                  >
                    View Details
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setCompleteDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="sr-only">Mark as complete</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedProjectId && handleDeleteProject(selectedProjectId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Complete Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Completion</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this project as complete?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => selectedProjectId && handleMarkAsComplete(selectedProjectId)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}