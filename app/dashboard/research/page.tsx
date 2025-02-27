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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth"; // For reading .docx files
import axios from "axios"; // For ChatGPT API calls

interface ResearchPaper {
  id: number;
  title: string;
  details: string;
  status: "unpublished" | "published";
  created_at: string;
}

export default function ResearchPage() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [projectDescription, setProjectDescription] = useState("");
  const [suggestedVenues, setSuggestedVenues] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [convertedContent, setConvertedContent] = useState("");
  const [publishingCost, setPublishingCost] = useState<string | null>(null);
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

  // Suggest publication venues based on project description
  const suggestVenues = () => {
    const keywords = projectDescription.toLowerCase();
    let suggestions: string[] = [];
    if (keywords.includes("computer") || keywords.includes("software")) {
      suggestions = ["IEEE Transactions", "Springer Computer Science", "arXiv"];
    } else if (keywords.includes("biology") || keywords.includes("health")) {
      suggestions = ["Nature", "PLOS ONE", "BioMed Central"];
    } else {
      suggestions = ["arXiv", "Springer Open", "Generic Open Access Journal"];
    }
    setSuggestedVenues(suggestions);
  };

  // Handle file upload
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    onDrop: (acceptedFiles) => {
      setUploadedFile(acceptedFiles[0]);
    },
  });

  // Convert .docx to text and then to desired format using ChatGPT
  const convertToFormat = async () => {
    if (!uploadedFile || !selectedFormat) return;

    // Extract text from .docx
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value;

    // Call ChatGPT API to convert text to selected format
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Convert the following research paper content into ${selectedFormat} format:\n\n${rawText}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer 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`, // Replace with your API key
            "Content-Type": "application/json",
          },
        }
      );
      setConvertedContent(response.data.choices[0].message.content);

      // Estimate publishing cost (hardcoded for simplicity, could be fetched from websites)
      const costs: { [key: string]: string } = {
        "IEEE Transactions": "$1000-$2000",
        "Springer Computer Science": "$1500-$3000",
        "arXiv": "Free",
        "Nature": "$2000-$5000",
        "PLOS ONE": "$1500",
      };
      setPublishingCost(costs[selectedVenue] || "Varies by journal");
    } catch (error) {
      console.error("Error converting content:", error);
    }
  };

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
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Research Paper
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Research Paper</DialogTitle>
              <DialogDescription>
                Learn where to publish your work and convert it to the desired format.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                You can publish your research in academic journals (e.g., IEEE, Springer, Nature), open-access platforms
                (e.g., arXiv, PLOS ONE), or university repositories. Tell us about your project to get suggestions!
              </p>
              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Briefly describe your research (e.g., topic, field)..."
                />
                <Button onClick={suggestVenues} className="mt-2">Suggest Venues</Button>
              </div>
              {suggestedVenues.length > 0 && (
                <div>
                  <Label>Suggested Publication Venues</Label>
                  <Select onValueChange={setSelectedVenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {suggestedVenues.map((venue) => (
                        <SelectItem key={venue} value={venue}>
                          {venue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedVenue && (
                <div>
                  <Label>Select Format</Label>
                  <Select onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IEEE">IEEE</SelectItem>
                      <SelectItem value="APA">APA</SelectItem>
                      <SelectItem value="Springer">Springer</SelectItem>
                      <SelectItem value="Springer">Copywrite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedFormat && (
                <div>
                  <Label>Upload Your Work (.docx)</Label>
                  <div {...getRootProps()} className="border-dashed border-2 p-4 text-center">
                    <input {...getInputProps()} />
                    <p>Drag & drop your .docx file here, or click to select</p>
                  </div>
                  {uploadedFile && <p>Uploaded: {uploadedFile.name}</p>}
                  <Button onClick={convertToFormat} className="mt-2">
                    Convert to {selectedFormat}
                  </Button>
                </div>
              )}
              {convertedContent && (
                <div>
                  <Label>Converted Content</Label>
                  <Textarea value={convertedContent} readOnly className="h-40" />
                  {publishingCost && <p>Estimated Publishing Cost: {publishingCost}</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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