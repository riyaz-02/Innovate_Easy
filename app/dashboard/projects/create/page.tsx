"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ArrowRight, BrainCircuit, Home, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient"; // Ensure this is set up
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Ensure in .env.local
  dangerouslyAllowBrowser: true, // For testing; use backend in production
});

export default function CreateProjectPage() {
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
  const router = useRouter();

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
      setShowForm(false); // Ensure form isn’t shown until accept
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

      const { error } = await supabase.from("projects").insert(projectData);
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      console.log("Project saved successfully:", projectData);
      setIsQuizOpen(false);
      router.push("/dashboard/projects"); // Redirect to projects page
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

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Choose an option to get started with your new project.</p>
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
              Take Project Quiz
            </CardTitle>
            <CardDescription>Answer a few questions and let AI generate project ideas for you.</CardDescription>
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
            selectedOption === "idea" ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => handleOptionClick("idea")}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-primary" />
              I Have an Idea
            </CardTitle>
            <CardDescription>Create a project based on your own idea.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Already have a project in mind? Skip the quiz and directly create your project by providing details about
              your idea, technologies, and goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={selectedOption === "idea" ? "default" : "outline"} className="w-full">
              Create My Idea
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
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
          <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Leaving now will discard your current quiz progress. Do you want to return to the dashboard?
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