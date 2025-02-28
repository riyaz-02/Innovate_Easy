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
import { ArrowLeft, ArrowRight, BrainCircuit, Home, Lightbulb, BookOpen, CheckCircle, Clock, MoreHorizontal, Plus, Trash, Edit, Eye } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth"; // For reading .docx files
import axios from "axios"; // For API calls
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Ensure in .env.local
  dangerouslyAllowBrowser: true, // For testing; use backend in production
});

interface Project {
  id: number;
  name: string;
  description: string;
  status: "pending" | "published";
  created_at: string;
  complexity?: string;
  estimated_duration?: string;
  features?: string;
  challenges?: string;
  project_type?: string;
  experience_level?: string;
  languages?: string;
  device?: string;
}

// Interface for Google Scholar search results from SerpAPI
interface ScholarResult {
  title: string;
  authors: string[];
  publication: string;
  year: number;
  link: string;
}

export default function CreateProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizData, setQuizData] = useState({
    projectType: "",
    experienceLevel: "",
    languages: [] as string[],
    customSubfield: "",
    customLanguage: "",
    device: "",
  });
  const [currentIdea, setCurrentIdea] = useState<{ text: string; complexity: string; duration: string } | null>(null);
  const [ideaHistory, setIdeaHistory] = useState<{ text: string; complexity: string; duration: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [previousIdea, setPreviousIdea] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    overview: "",
    features: "",
    challenges: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [projectDescription, setProjectDescription] = useState("");
  const [suggestedVenues, setSuggestedVenues] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [convertedContent, setConvertedContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [publishingCost, setPublishingCost] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [scholarResults, setScholarResults] = useState<ScholarResult[]>([]);
  const [scholarSearch, setScholarSearch] = useState("");
  const [isFetchingScholar, setIsFetchingScholar] = useState(false);
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
          .select("id, name, description, status, created_at, complexity, estimated_duration, features, challenges, project_type, experience_level, languages, device")
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

  // Fetch published research papers from Google Scholar via server-side proxy
  const fetchScholarPapers = async (query: string) => {
    setIsFetchingScholar(true);
    try {
      const response = await axios.get(`/api/scholar?q=${encodeURIComponent(query)}`);
      const results = response.data.organic_results?.map((result: any) => ({
        title: result.title,
        authors: result.authors || [],
        publication: result.publication?.title || "Unknown",
        year: result.publication_info?.summary?.match(/\d{4}/)?.[0] || "Unknown",
        link: result.link,
      })) || [];
      setScholarResults(results);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching Scholar papers:", error.response?.data || error.message);
        alert("Failed to fetch published papers. Please check your query or try again later.");
      } else {
        console.error("Unexpected error fetching Scholar papers:", error);
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsFetchingScholar(false);
    }
  };

  // Handle file upload
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    onDrop: (acceptedFiles) => {
      setUploadedFile(acceptedFiles[0]);
    },
  });

  // Convert .docx to text and then to desired format using server-side API
  const convertToFormat = async () => {
    if (!uploadedFile || !selectedFormat) return;

    setLoading(true);
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value;

      const response = await axios.post("/api/convertFormat", {
        text: rawText,
        format: selectedFormat,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setConvertedContent(response.data.content); // Assuming the API returns { content: "formatted text" }
      setEditedContent(response.data.content);
      const costs: { [key: string]: string } = {
        "IEEE Transactions": "$1000-$2000",
        "Springer Computer Science": "$1500-$3000",
        "arXiv": "Free",
        "Nature": "$2000-$5000",
        "PLOS ONE": "$1500",
      };
      setPublishingCost(costs[selectedVenue] || "Varies by journal");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error converting content:", error.response?.data || error.message);
      } else {
        console.error("Error converting content:", error);
      }
      if (axios.isAxiosError(error)) {
        alert(`Failed to convert content: ${error.response?.statusText || "Unknown error"}`);
      } else {
        alert("Failed to convert content: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save edited content
  const saveEditedContent = () => {
    setConvertedContent(editedContent);
    console.log("Saved edited content:", editedContent);
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    if (option === "quiz") {
      setIsQuizOpen(true);
      setQuizStep(0);
    }
  };

  const handleQuizNext = () => {
    if (quizStep < 3) setQuizStep(quizStep + 1);
  };

  const handleQuizPrevious = () => {
    if (quizStep > 0) setQuizStep(quizStep - 1);
    else setIsQuizOpen(false);
  };

  const handleQuizInput = (field: keyof typeof quizData, value: string | string[]) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const generateIdea = async (reasonFilter: string = "") => {
    setIsGenerating(true);
    try {
      const prompt = `
        Generate exactly 1 project idea based on the following user inputs:
        - Project Type: ${quizData.projectType}${quizData.customSubfield ? ` (${quizData.customSubfield})` : ""}
        - Experience Level: ${quizData.experienceLevel}
        - Languages: ${quizData.languages.join(", ")}${quizData.customLanguage ? `, ${quizData.customLanguage}` : ""}
        - Device: ${quizData.device}
        ${
          reasonFilter && previousIdea
            ? `The user rejected the previous idea: "${previousIdea}" because: "${reasonFilter}". Exclude any ideas that resemble this rejected idea or align with the rejection reason. For example, if the reason is "too simple," generate a more complex idea; if "too long," shorten the duration.`
            : ""
        }
        Provide:
        - A concise sentence describing a unique project matching the inputs.
        - Complexity Level: a numeric value from 1 to 10 (e.g., "3", "7"), reflecting the project's difficulty.
        - Estimated Duration: in days (e.g., "5 days", "13 days"), suitable for the complexity and experience level.
        Format the response strictly as: "Idea: [description] | Complexity: [level] | Duration: [time]".
        Ensure the idea is distinct and adheres to the user's preferences and rejection feedback.
      `;

      console.log("Prompt sent to OpenAI:", prompt);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      });

      const ideaText = response.choices[0].message.content || "";
      console.log("OpenAI Response:", ideaText);
      const [textPart, complexityPart, durationPart] = ideaText.split(" | ");
      const idea = {
        text: textPart.replace("Idea:", "").trim(),
        complexity: complexityPart?.replace("Complexity:", "").trim() || "5",
        duration: durationPart?.replace("Duration:", "").trim() || "Unknown",
      };
      idea.complexity =
        isNaN(parseInt(idea.complexity)) || parseInt(idea.complexity) < 1 || parseInt(idea.complexity) > 10
          ? "5"
          : idea.complexity;
      idea.duration = idea.duration.includes("days") ? idea.duration : `${idea.duration} days`;
      setPreviousIdea(idea.text);
      setCurrentIdea(idea);
      setQuizStep(4);
      setShowReasonInput(false);
      setRejectionReason("");
      setShowForm(false);
    } catch (error) {
      console.error("Error generating idea:", error);
      alert("Failed to generate an idea. Check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = () => {
    if (!showReasonInput && currentIdea) {
      setIdeaHistory((prev) => [...prev, currentIdea]);
      setShowReasonInput(true);
    }
  };

  const handleCancelReject = () => {
    setShowReasonInput(false);
    setRejectionReason("");
  };

  const handleSubmitReject = async () => {
    if (rejectionReason.trim()) {
      setIsSubmitting(true);
      try {
        await generateIdea(rejectionReason);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert("Please provide a reason for rejection.");
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      console.log("Accepted Idea:", currentIdea);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowForm(true);
    } catch (error) {
      console.error("Error accepting idea:", error);
      alert("Failed to accept the idea. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePreviousIdea = () => {
    if (ideaHistory.length > 0) {
      const lastIdea = ideaHistory[ideaHistory.length - 1];
      setCurrentIdea(lastIdea);
      setIdeaHistory((prev) => prev.slice(0, -1));
      setShowReasonInput(false);
      setRejectionReason("");
      setShowForm(false);
    }
  };

  const handleBackToHome = () => {
    setShowConfirmDialog(true);
  };

  const confirmBackToHome = () => {
    setShowConfirmDialog(false);
    setIsQuizOpen(false);
    router.push("/dashboard");
  };

  const handleFormInput = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        Given the project idea: "${currentIdea?.text}",
        Generate:
        - Project Overview: A detailed paragraph describing the project (150-200 words).
        - Features: A list of 3-5 key features, one per line, prefixed with "-".
        - Potential Challenges: A list of 2-4 potential challenges, one per line, prefixed with "-".
        Format strictly as:
        Overview: [paragraph]
        Features:
        - [feature 1]
        - [feature 2]
        - [feature 3]
        Challenges:
        - [challenge 1]
        - [challenge 2]
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      const result = response.choices[0].message.content || "";
      console.log("Auto Generate Response:", result);

      const overviewMatch = result.match(/Overview:([\s\S]*?)(?=Features:)/);
      const featuresMatch = result.match(/Features:([\s\S]*?)(?=Challenges:)/);
      const challengesMatch = result.match(/Challenges:([\s\S]*$)/);

      const overview = overviewMatch ? overviewMatch[1].trim() : "";
      const features = featuresMatch
        ? featuresMatch[1]
            .trim()
            .split("\n")
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => line.replace("-", "").trim())
            .join("\n")
        : "";
      const challenges = challengesMatch
        ? challengesMatch[1]
            .trim()
            .split("\n")
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => line.replace("-", "").trim())
            .join("\n")
        : "";

      setFormData({ overview, features, challenges });
    } catch (error) {
      console.error("Error auto-generating:", error);
      alert("Failed to auto-generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const projectData = {
        user_id: user.id,
        name: currentIdea?.text || "Untitled Project",
        description: formData.overview,
        status: "pending",
        complexity: parseInt(currentIdea?.complexity || "5"),
        estimated_duration: currentIdea?.duration,
        features: formData.features,
        challenges: formData.challenges,
        project_type: quizData.projectType + (quizData.customSubfield ? ` (${quizData.customSubfield})` : ""),
        experience_level: quizData.experienceLevel,
        languages: quizData.languages.join(", ") + (quizData.customLanguage ? `, ${quizData.customLanguage}` : ""),
        device: quizData.device,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("projects").insert(projectData).select("id").single();
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      console.log("Project saved successfully:", projectData);
      const projectId = data.id; // Get the inserted project's ID
      setIsQuizOpen(false);
      router.push(`/dashboard/projects/${projectId}?tab=roadmap`); // Redirect to Roadmap tab
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please check your database setup and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const projectTypes = [
    { value: "systems", label: "Systems Software Engineering", sub: "OS, drivers, firmware, embedded systems" },
    { value: "web", label: "Web Development", sub: "Frontend and backend web applications" },
    { value: "mobile", label: "Mobile Engineering", sub: "Native and cross-platform mobile apps" },
    { value: "ml", label: "ML Engineering", sub: "AI systems, model deployment, data pipelines" },
    { value: "game", label: "Game Development", sub: "Engines, graphics, game mechanics" },
  ];

  const experienceLevels = [
    { value: "beginner", label: "Beginner", sub: "Just starting out" },
    { value: "intermediate", label: "Intermediate", sub: "Have done a few projects" },
    { value: "advanced", label: "Advanced", sub: "Lots of Projects" },
    { value: "expert", label: "Expert", sub: "Expert in the field" },
  ];

  const languageOptions: { [key: string]: string[] } = {
    systems: ["C", "C++", "Rust", "Python", "Assembly"],
    web: ["JavaScript", "TypeScript", "Python", "PHP", "Ruby", "HTML/CSS"],
    mobile: ["Swift", "Kotlin", "Java", "Dart", "React Native"],
    ml: ["Python", "R", "TensorFlow", "PyTorch", "Java"],
    game: ["C++", "C#", "Unity", "UnrealScript", "Python"],
  };

  const devices = [
    { value: "windows", label: "Windows", sub: "Windows PC or laptop" },
    { value: "macos", label: "MacOS", sub: "Mac computer or MacBook" },
    { value: "linux", label: "Linux", sub: "Linux-based systems" },
  ];

  const relevantLanguages = quizData.projectType ? languageOptions[quizData.projectType] || [] : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 overflow-y-auto h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project or Research Paper</h1>
        <p className="text-muted-foreground">Choose an option to get started with your new project or research paper.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all hover:border-primary ${
            selectedOption === "quiz" ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => handleOptionClick("quiz")}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
              Take Research Quiz
            </CardTitle>
            <CardDescription>Answer a few questions and let AI generate Research ideas for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI will analyze your preferences, experience level, and interests to suggest tailored project ideas
              that match your skills and goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={selectedOption === "quiz" ? "default" : "outline"} className="w-full">
              Start Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${
            selectedOption === "research" ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => setOpenModal(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Format Research Paper
            </CardTitle>
            <CardDescription>Generate and format a research paper based on your work.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Describe your research, choose a publication venue, and convert your work into a formatted document (e.g., IEEE, APA).
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={selectedOption === "research" ? "default" : "outline"} className="w-full">
              Start Formatting
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <div className="relative p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 left-0 bg-white/30 hover:bg-white/40 text-gray-800 rounded-full"
              onClick={handleBackToHome}
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Back to Home</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>
              {quizStep === 0 && "What type of project are you building?"}
              {quizStep === 1 && "What's your experience level?"}
              {quizStep === 2 && "Which languages would you like to use?"}
              {quizStep === 3 && "What device are you using?"}
              {quizStep === 4 && "Your Project Idea"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4">
            {quizStep === 0 && (
              <div className="space-y-2">
                {projectTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      quizData.projectType === type.value ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => handleQuizInput("projectType", type.value)}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.sub}</p>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add Custom Subfield"
                  value={quizData.customSubfield}
                  onChange={(e) => handleQuizInput("customSubfield", e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>
            )}

            {quizStep === 1 && (
              <div className="space-y-2">
                {experienceLevels.map((level) => (
                  <div
                    key={level.value}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      quizData.experienceLevel === level.value ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => handleQuizInput("experienceLevel", level.value)}
                  >
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {quizStep === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Recommended for {quizData.projectType || "this field"} (Select multiple)
                </p>
                {relevantLanguages.map((lang) => (
                  <div
                    key={lang}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      quizData.languages.includes(lang) ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => {
                      const newLanguages = quizData.languages.includes(lang)
                        ? quizData.languages.filter((l) => l !== lang)
                        : [...quizData.languages, lang];
                      handleQuizInput("languages", newLanguages);
                    }}
                  >
                    <p className="font-medium">{lang}</p>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add custom language/framework"
                  value={quizData.customLanguage}
                  onChange={(e) => handleQuizInput("customLanguage", e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>
            )}

            {quizStep === 3 && (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.value}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      quizData.device === device.value ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => handleQuizInput("device", device.value)}
                  >
                    <p className="font-medium">{device.label}</p>
                    <p className="text-sm text-muted-foreground">{device.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {quizStep === 4 && (
              <div className="space-y-4">
                {currentIdea ? (
                  showForm ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-300 to-purple-300">
                        <p className="text-lg font-semibold text-white">{currentIdea.text}</p>
                        <p className="text-sm text-white">
                          Complexity: <span className="font-medium">{currentIdea.complexity}</span> | Duration:{" "}
                          <span className="font-medium">{currentIdea.duration}</span>
                        </p>
                      </div>
                      <p className="text-sm italic text-gray-600">
                        Let's create a skeleton for your project. This will help you organize your thoughts and plan the
                        implementation.
                      </p>
                      <div className="space-y-2">
                        <label className="font-medium">Project Overview</label>
                        <Textarea
                          placeholder="Write a detailed overview of your project here..."
                          value={formData.overview}
                          onChange={(e) => handleFormInput("overview", e.target.value)}
                          className="w-full h-24 resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-medium">Features</label>
                        <Textarea
                          placeholder="List your project features here, one per line..."
                          value={formData.features}
                          onChange={(e) => handleFormInput("features", e.target.value)}
                          className="w-full h-24 resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-medium">Potential Challenges</label>
                        <Textarea
                          placeholder="List potential challenges here, one per line..."
                          value={formData.challenges}
                          onChange={(e) => handleFormInput("challenges", e.target.value)}
                          className="w-full h-24 resize-y"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleAutoGenerate} disabled={isGenerating || isSaving}>
                          Auto Generate
                        </Button>
                        <Button
                          variant="default"
                          onClick={handleSaveAndContinue}
                          disabled={isSaving || isGenerating}
                        >
                          {isSaving ? "Saving..." : "Save and Continue"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-300 to-purple-300">
                        <p className="text-lg font-semibold text-white">{currentIdea.text}</p>
                        <p className="text-sm text-white">
                          Complexity: <span className="font-medium">{currentIdea.complexity}</span> | Duration:{" "}
                          <span className="font-medium">{currentIdea.duration}</span>
                        </p>
                      </div>
                      {showReasonInput && (
                        <input
                          type="text"
                          placeholder="Reason for rejection"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-2 border rounded mt-2"
                        />
                      )}
                      <div className="flex justify-between">
                        <div className="space-x-2">
                          {ideaHistory.length === 0 ? (
                            <Button
                              variant="outline"
                              onClick={() => setQuizStep(3)}
                              disabled={isSubmitting || isAccepting}
                            >
                              Previous Quiz
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={handlePreviousIdea}
                              disabled={ideaHistory.length === 0 || isSubmitting || isAccepting}
                            >
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Previous Idea
                            </Button>
                          )}
                        </div>
                        <div className="space-x-2">
                          {showReasonInput ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={handleCancelReject}
                                disabled={isSubmitting || isAccepting}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                onClick={handleSubmitReject}
                                disabled={!rejectionReason.trim() || isSubmitting || isAccepting}
                              >
                                {isSubmitting ? "Submitting..." : "Submit"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isSubmitting || isAccepting}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                onClick={handleAccept}
                                disabled={isSubmitting || isAccepting}
                              >
                                {isAccepting ? "Accepting..." : "Accept"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Generating idea...</p>
                )}
              </div>
            )}
          </div>

          {quizStep < 4 && (
            <div className="flex justify-between mt-6 px-4 pb-4">
              <Button variant="outline" onClick={handleQuizPrevious} disabled={quizStep === 0}>
                Previous
              </Button>
              {quizStep < 3 ? (
                <Button variant="default" onClick={handleQuizNext}>
                  Next
                </Button>
              ) : (
                <Button variant="default" onClick={() => generateIdea()} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Research Paper Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Research Paper</DialogTitle>
            <DialogDescription>
              Learn where to publish your work, convert it to the desired format, or explore existing papers.
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
                className="min-h-[100px]"
              />
              <Button onClick={suggestVenues} className="mt-2">Suggest Venues</Button>
            </div>
            <div>
              <Label htmlFor="scholarSearch">Search Existing Research Papers</Label>
              <Input
                id="scholarSearch"
                value={scholarSearch}
                onChange={(e) => setScholarSearch(e.target.value)}
                placeholder="Search by title, author, or keyword..."
                className="mb-2"
              />
              <Button onClick={() => fetchScholarPapers(scholarSearch)} disabled={isFetchingScholar}>
                {isFetchingScholar ? "Searching..." : "Search Papers"}
              </Button>
            </div>
            {scholarResults.length > 0 && (
              <div className="mt-4">
                <Label>Published Research Papers</Label>
                <div className="grid gap-4">
                  {scholarResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <h3 className="font-semibold">{result.title}</h3>
                      <p className="text-sm text-muted-foreground">Authors: {result.authors.join(", ")}</p>
                      <p className="text-sm text-muted-foreground">Publication: {result.publication} ({result.year})</p>
                      <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View Paper
                      </a>
                    </Card>
                  ))}
                </div>
              </div>
            )}
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
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "view" | "edit")}>
                  <TabsList>
                    <TabsTrigger value="view">
                      <Eye className="mr-2 h-4 w-4" /> View
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="view">
                    <Label>Converted Content (View Mode)</Label>
                    <div className="mt-2 p-4 bg-muted rounded-md border max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                      {convertedContent}
                    </div>
                    <Button onClick={() => setActiveTab("edit")} className="mt-2">
                      Edit Content
                    </Button>
                  </TabsContent>
                  <TabsContent value="edit">
                    <Label>Converted Content (Edit Mode)</Label>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="mt-2 min-h-[300px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={saveEditedContent}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setActiveTab("view")}>
                        Back to View
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                {publishingCost && <p className="mt-2">Estimated Publishing Cost: {publishingCost}</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
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

      {/* Project List (Optional - Display existing projects) */}
      {projects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => {
            const colorIndex = i % cardColors.length;
            const colors = cardColors[colorIndex];
            const completion = project.status === "published" ? 100 : 50;

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
                      <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Updated {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {project.status === "published" ? (
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