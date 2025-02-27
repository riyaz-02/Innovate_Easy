"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Home, List, Map } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string;
  status: "pending" | "completed";
  complexity: number;
  estimated_duration: string;
  features: string;
  challenges: string;
  project_type: string;
  experience_level: string;
  languages: string;
  device: string;
  created_at: string;
}

export default function ViewProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          router.push("/dashboard/projects");
          return;
        }

        setProject(data);
        console.log("Fetched Project:", data);
      } catch (error) {
        console.error("Project Fetch Error:", error);
        router.push("/dashboard/projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, router]);

  const handleBack = () => {
    router.push("/dashboard/projects");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Project not found.</p>
      </div>
    );
  }

  const createdDate = new Date(project.created_at).toLocaleDateString();
  const daysEstimate = parseInt(project.estimated_duration) || 0;
  const deadline = new Date(new Date(project.created_at).getTime() + daysEstimate * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Project Navbar */}
      <nav className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Projects</span>
            </Button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <Tabs defaultValue="info" className="flex items-center">
            <TabsList>
              <TabsTrigger value="info">
                <Home className="h-4 w-4 mr-2" />
                Project Info
              </TabsTrigger>
              <TabsTrigger value="skeleton">
                <List className="h-4 w-4 mr-2" />
                Skeleton
              </TabsTrigger>
              <TabsTrigger value="roadmap">
                <Map className="h-4 w-4 mr-2" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger value="reminder">
                <Calendar className="h-4 w-4 mr-2" />
                Reminder
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <Tabs defaultValue="info" className="w-full">
          <TabsContent value="info" className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Created on</p>
              <p className="text-lg font-medium">{createdDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Complexity Level</p>
              <p className="text-lg font-medium">{project.complexity}/10</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Languages</p>
              <p className="text-lg font-medium">{project.languages}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="text-lg font-medium">{deadline}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Type</p>
              <p className="text-lg font-medium">{project.project_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience Level</p>
              <p className="text-lg font-medium">{project.experience_level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Device</p>
              <p className="text-lg font-medium">{project.device}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-lg font-medium">{project.description || "No description provided."}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-medium capitalize">{project.status}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="default">Edit Project</Button>
            </div>
          </TabsContent>

          <TabsContent value="skeleton" className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Project Overview</p>
              <p className="text-lg font-medium">{project.description || "No overview provided."}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Features</p>
              {project.features ? (
                <ul className="list-disc pl-5 text-lg font-medium">
                  {project.features.split("\n").map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg font-medium">No features listed.</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Challenges</p>
              {project.challenges ? (
                <ul className="list-disc pl-5 text-lg font-medium">
                  {project.challenges.split("\n").map((challenge, index) => (
                    <li key={index}>{challenge}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg font-medium">No challenges listed.</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <p className="text-muted-foreground text-lg">Roadmap coming soon...</p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reminder" className="space-y-6">
            <p className="text-muted-foreground text-lg">Reminder setup coming soon...</p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}