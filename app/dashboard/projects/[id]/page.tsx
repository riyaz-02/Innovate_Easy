"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, CheckCircle, Home, List, Map } from "lucide-react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

interface RoadmapStep {
  id: number;
  project_id: number;
  step_name: string;
  description: string;
  completion_guideline: string;
  status: "pending" | "completed";
  position: number;
}

export default function ViewProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "info";

  useEffect(() => {
    const fetchProjectAndRoadmap = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (projectError) throw projectError;
        if (!projectData) {
          router.push("/dashboard/projects");
          return;
        }

        setProject(projectData);

        const { data: roadmapData, error: roadmapError } = await supabase
          .from("roadmap_steps")
          .select("*")
          .eq("project_id", id)
          .order("position", { ascending: true });

        if (roadmapError) throw roadmapError;
        setRoadmapSteps(roadmapData || []);
        console.log("Fetched Project:", projectData);
        console.log("Fetched Roadmap Steps:", roadmapData);
      } catch (error) {
        console.error("Fetch Error:", error);
        router.push("/dashboard/projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndRoadmap();
  }, [id, router]);

  const handleBack = () => {
    router.push("/dashboard/projects");
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const prompt = `
        Generate a detailed project roadmap for: "${project?.name}"
        Based on:
        - Description: ${project?.description}
        - Features: ${project?.features}
        - Challenges: ${project?.challenges}
        - Project Type: ${project?.project_type}
        - Languages: ${project?.languages}
        - Complexity: ${project?.complexity}
        - Estimated Duration: ${project?.estimated_duration}
        
        Provide 10-15 steps from start to completion, each with:
        - Step Name: A concise title (e.g., "Database Design and Setup").
        - Description: A brief explanation (50-100 words).
        - Completion Guideline: A short guide on how to complete the step.
        - Status: Set as "pending".
        - Position: Assign a sequential number (1, 2, 3, ...).

        Format strictly as:
        Step [position]: [step_name]
        Description: [description]
        Guideline: [completion_guideline]
        Status: pending
        [Separate each step with two newlines (\n\n)]
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      const result = response.choices[0].message.content || "";
      console.log("Roadmap Generation Response:", result);

      // Split by double newline (\n\n) instead of "---"
      const stepBlocks = result.split(/\n\n/).filter(block => block.trim().startsWith("Step"));
      console.log("Step Blocks After Split:", stepBlocks);

      const steps = stepBlocks.map((block) => {
        const lines = block.split("\n").filter(line => line.trim() !== "");
        console.log("Parsing Step Block:", lines);

        const stepMatch = lines[0]?.match(/Step (\d+): (.+)/);
        const descMatch = lines[1]?.match(/Description: (.+)/);
        const guideMatch = lines[2]?.match(/Guideline: (.+)/);
        const statusMatch = lines[3]?.match(/Status: (.+)/);

        return {
          project_id: parseInt(id as string),
          step_name: stepMatch ? stepMatch[2] : "Unnamed Step",
          description: descMatch ? descMatch[1] : "No description provided",
          completion_guideline: guideMatch ? guideMatch[1] : "No guideline provided",
          status: (statusMatch ? statusMatch[1] : "pending") as "pending" | "completed",
          position: stepMatch ? parseInt(stepMatch[1]) : 0,
        };
      }).filter(step => step.position > 0);

      console.log("Parsed Steps Before Insert:", steps);

      // Insert all steps into Supabase
      const { data, error } = await supabase.from("roadmap_steps").insert(steps).select();
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      console.log("Inserted Roadmap Steps from Supabase:", data);
      setRoadmapSteps(data || []);
    } catch (error) {
      console.error("Error generating roadmap:", error);
      alert("Failed to generate roadmap. Please try again.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleStepClick = (step: RoadmapStep) => {
    setSelectedStep(step);
    setModalOpen(true);
  };

  const handleSaveStep = async () => {
    if (!selectedStep) return;
    try {
      const { error } = await supabase
        .from("roadmap_steps")
        .update({
          step_name: selectedStep.step_name,
          description: selectedStep.description,
          completion_guideline: selectedStep.completion_guideline,
          status: selectedStep.status,
        })
        .eq("id", selectedStep.id);

      if (error) throw error;

      setRoadmapSteps((prev) =>
        prev.map((step) => (step.id === selectedStep.id ? selectedStep : step))
      );
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving roadmap step:", error);
      alert("Failed to save step. Please try again.");
    }
  };

  const handleFinishProject = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      setProject((prev) => (prev ? { ...prev, status: "completed" } : null));
    } catch (error) {
      console.error("Error finishing project:", error);
      alert("Failed to finish project. Please try again.");
    }
  };

  const handleToggleTask = async (stepId: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
      const { error } = await supabase
        .from("roadmap_steps")
        .update({ status: newStatus })
        .eq("id", stepId);

      if (error) throw error;

      setRoadmapSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, status: newStatus } : step))
      );
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Failed to update task status. Please try again.");
    }
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
  const completedTasks = roadmapSteps.filter((step) => step.status === "completed").length;
  const totalTasks = roadmapSteps.length;

  console.log("Rendering Roadmap Steps:", roadmapSteps);

  return (
    <div className="min-h-screen flex flex-col">
      <Tabs defaultValue={initialTab} className="flex-1">
        {/* Project Navbar */}
        <nav className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Projects</span>
              </Button>
            </div>
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
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {/* Project Title Box */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-300 to-purple-300">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          </div>

          {/* Tabbed Content */}
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Project Roadmap</h2>
                <p className="text-sm text-muted-foreground">Development progression timeline</p>
              </div>
              {roadmapSteps.length > 0 && (
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">{completedTasks} of {totalTasks} tasks</p>
                  <Button variant="outline">Manage Tasks</Button>
                  <Button
                    variant="default"
                    onClick={handleFinishProject}
                    disabled={project.status === "completed"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish Project
                  </Button>
                </div>
              )}
            </div>

            {roadmapSteps.length === 0 ? (
              <div className="text-center">
                <p className="text-muted-foreground text-lg mb-4">No roadmap generated yet.</p>
                <Button
                  variant="default"
                  onClick={handleGenerateRoadmap}
                  disabled={isGeneratingRoadmap}
                >
                  {isGeneratingRoadmap ? "Generating..." : "Generate Roadmap"}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-300"></div>
                {roadmapSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center mb-6 cursor-pointer ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                    onClick={() => handleStepClick(step)}
                  >
                    <div
                      className={`w-1/2 p-4 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={step.status === "completed"}
                          onCheckedChange={() => handleToggleTask(step.id, step.status)}
                        />
                        <p className="text-lg font-medium">{step.step_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
        </main>
      </Tabs>

      {/* Roadmap Step Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStep?.step_name}</DialogTitle>
          </DialogHeader>
          {selectedStep && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <Textarea
                  value={selectedStep.description}
                  onChange={(e) => setSelectedStep({ ...selectedStep, description: e.target.value })}
                  className="w-full h-24"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Guideline</p>
                <Textarea
                  value={selectedStep.completion_guideline}
                  onChange={(e) => setSelectedStep({ ...selectedStep, completion_guideline: e.target.value })}
                  className="w-full h-24"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <select
                  value={selectedStep.status}
                  onChange={(e) => setSelectedStep({ ...selectedStep, status: e.target.value as "pending" | "completed" })}
                  className="w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveStep}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}