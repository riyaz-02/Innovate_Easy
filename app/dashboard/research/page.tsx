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

interface ResearchPaper {
  id: number;
  title: string;
  details: string; // Used as description
  status: "unpublished" | "published";
  created_at: string;
  // Add pages or completion fields if needed later
}

export default function ResearchPage() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Array of colors for research paper cards
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
          .select("id, title, details, status, created_at")
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading research papers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Papers</h1>
          <p className="text-muted-foreground">Manage your research papers and track their progress.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Research Paper
        </Button>
      </div>

      {researchPapers.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p>No research papers found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {researchPapers.map((paper, i) => {
            const colorIndex = i % cardColors.length;
            const colors = cardColors[colorIndex];

            // Completion: 100% if published, otherwise estimate (add a pages/completion field later if needed)
            const completion = paper.status === "published" ? 100 : 50;

            return (
              <Card key={paper.id} className={`overflow-hidden ${colors.bg} ${colors.border}`}>
                <CardHeader className="p-0">
                  <div className={`h-3 ${colors.progress}`} />
                  <div className="p-6 pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle>{paper.title}</CardTitle>
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
                      {paper.details || "No description available."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Updated {new Date(paper.created_at).toLocaleDateString()}
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
                  <div className="mt-4">
                    <div className="text-sm font-medium">Completion</div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${colors.progress}`}
                        style={{ width: `${completion}%` }}
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