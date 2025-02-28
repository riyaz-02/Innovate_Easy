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
import { BookOpen, CheckCircle, Clock, MoreHorizontal, Plus, Trash } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ResearchPaper {
  id: number;
  user_id: string;
  paper_type: string;
  domain: string;
  topic: string;
  status: "draft" | "published";
  created_at: string;
}

export default function ResearchPage() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  const cardColors = [
    { bg: "bg-purple-500/10", border: "border-purple-500/20", progress: "bg-purple-500" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/20", progress: "bg-indigo-500" },
    { bg: "bg-blue-500/10", border: "border-blue-500/20", progress: "bg-blue-500" },
    { bg: "bg-pink-500/10", border: "border-pink-500/20", progress: "bg-pink-500" },
    { bg: "bg-teal-500/10", border: "border-teal-500/20", progress: "bg-teal-500" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", progress: "bg-emerald-500" },
  ];

  useEffect(() => {
    const fetchResearchPapers = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          console.log("No user logged in, redirecting to login");
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("research_papers")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResearchPapers(data || []);
        console.log("Fetched Research Papers:", data);
      } catch (error) {
        console.error("Research Papers Fetch Error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchResearchPapers();
  }, [router]);

  const handleBackToHome = () => {
    setShowConfirmDialog(true);
  };

  const confirmBackToHome = () => {
    setShowConfirmDialog(false);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading research papers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 overflow-y-auto h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Papers</h1>
        <p className="text-muted-foreground">Manage and explore your research papers.</p>
      </div>

      <Button onClick={() => router.push("/dashboard/research/create")}>
        <Plus className="mr-2 h-5 w-5 text-primary" />
        Create Research Paper
      </Button>

      {researchPapers.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {researchPapers.map((paper, i) => {
            const colorIndex = i % cardColors.length;
            const colors = cardColors[colorIndex];
            const completion = paper.status === "published" ? 100 : 50;

            return (
              <Card key={paper.id} className={`overflow-hidden ${colors.bg} ${colors.border}`}>
                <CardHeader className="p-0">
                  <div className={`h-3 ${colors.progress}`} />
                  <div className="p-6 pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle>{paper.topic}</CardTitle>
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
                      Type: {paper.paper_type}, Domain: {paper.domain}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Created {new Date(paper.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {paper.status === "published" ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                            Draft
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-6 pt-0">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Leaving now will discard your current progress. Do you want to return to the dashboard?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={confirmBackToHome}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
