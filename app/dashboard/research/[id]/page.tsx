"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bell, CheckCircle, Home, BookOpen, Clock } from "lucide-react";
import axios from "axios"; // For API calls
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface ResearchPaper {
  id: number;
  user_id: string;
  paper_type: string;
  domain: string;
  topic: string;
  status: "draft" | "published";
  created_at: string;
}

interface PaperContent {
  id?: number;
  paper_id: number;
  section_type: "abstract" | "introduction" | "section_heading" | "section_content" | "conclusion" | "references";
  content: string;
  position?: number;
}

interface Reminder {
  id: number;
  paper_id: number;
  user_id: string;
  reminder_date: string;
  message: string;
}

export default function ViewResearchPaperPage() {
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [paperContents, setPaperContents] = useState<PaperContent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0); // Time in seconds
  const [breakInterval, setBreakInterval] = useState(40); // Default 40 minutes in minutes
  const [focusMinInterval, setFocusMinInterval] = useState(5); // Default min 5 minutes in minutes
  const [focusMaxInterval, setFocusMaxInterval] = useState(10); // Default max 10 minutes in minutes
  const [lastBreakTime, setLastBreakTime] = useState(0); // Time of last break in seconds
  const [nextFocusTime, setNextFocusTime] = useState<number | null>(null); // Time of next focus reminder in seconds
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchPaperAndData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: paperData, error: paperError } = await supabase
          .from("research_papers")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (paperError) throw paperError;
        if (!paperData) {
          router.push("/dashboard/research");
          return;
        }

        setPaper(paperData);

        const { data: contentData, error: contentError } = await supabase
          .from("paper_contents")
          .select("*")
          .eq("paper_id", id)
          .order("position", { ascending: true });

        if (contentError) throw contentError;
        setPaperContents(contentData || []);

        const { data: reminderData, error: reminderError } = await supabase
          .from("reminders")
          .select("*")
          .eq("paper_id", id)
          .eq("user_id", user.id)
          .order("reminder_date", { ascending: true });

        if (reminderError) throw reminderError;
        setReminders(reminderData || []);
      } catch (error) {
        console.error("Fetch Error:", error);
        router.push("/dashboard/research");
      } finally {
        setLoading(false);
      }
    };

    fetchPaperAndData();
  }, [id, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);

        // Check for break reminder
        const breakIntervalSeconds = breakInterval * 60;
        if (sessionTime - lastBreakTime >= breakIntervalSeconds) {
          alert(`Time for a break! You've been working for ${breakInterval} minutes.`);
          setLastBreakTime(sessionTime);
        }

        // Check for focus reminder
        if (nextFocusTime !== null && sessionTime >= nextFocusTime) {
          alert("Stay focused! Take a moment to concentrate on your task.");
          setNextFocusTime(generateRandomFocusTime(focusMinInterval, focusMaxInterval));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, sessionTime, breakInterval, focusMinInterval, focusMaxInterval, lastBreakTime, nextFocusTime]);

  const handleBack = () => {
    router.push("/dashboard/research");
  };

  const generateRandomFocusTime = (min: number, max: number) => {
    const minSeconds = min * 60;
    const maxSeconds = max * 60;
    return sessionTime + Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  };

  const handleStartTimers = () => {
    setTimerActive(!timerActive);
    if (!timerActive) {
      setSessionTime(0);
      setLastBreakTime(0);
      setNextFocusTime(generateRandomFocusTime(focusMinInterval, focusMaxInterval));
    }
  };

  const handleAutoGenerate = async (sectionType: PaperContent["section_type"]) => {
    setIsGenerating(true);
    try {
      const prompt = `
        Generate content for a research paper section of type "${sectionType}" for the topic: "${paper?.topic}"
        Based on:
        - Paper Type: ${paper?.paper_type}
        - Domain: ${paper?.domain}
        - Status: ${paper?.status}

        Provide a concise and professional ${sectionType === "abstract" ? "150-200 word abstract" : sectionType === "introduction" ? "300-400 word introduction" : sectionType === "section_heading" ? "short heading (5-10 words)" : sectionType === "section_content" ? "200-300 word section content" : sectionType === "conclusion" ? "150-200 word conclusion" : "100-150 word references list"}.

        Format strictly as plain text.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || "";
      const newContent: PaperContent = {
        paper_id: parseInt(id as string),
        section_type: sectionType,
        content: content.trim(),
        position: paperContents.filter((c) => c.section_type === sectionType).length + 1,
      };

      const { data, error } = await supabase.from("paper_contents").insert(newContent).select();
      if (error) throw error;

      setPaperContents((prev) => [...prev, data[0]]);
    } catch (error) {
      console.error(`Error generating ${sectionType} content:`, error);
      alert(`Failed to generate ${sectionType} content. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckPlagiarism = async (content: string) => {
    try {
      const response = await axios.post("/api/checkPlagiarism", { content });
      alert(`Plagiarism Check Result: ${response.data.plagiarismPercentage}% similarity`);
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      alert("Failed to check plagiarism. Please try again.");
    }
  };

  const handleSaveContent = async (contentId: number | undefined, updatedContent: string, sectionType: PaperContent["section_type"]) => {
    try {
      if (contentId) {
        const { error } = await supabase
          .from("paper_contents")
          .update({ content: updatedContent })
          .eq("id", contentId);
        if (error) throw error;
      } else {
        const newContent: PaperContent = {
          paper_id: parseInt(id as string),
          section_type: sectionType,
          content: updatedContent,
          position: paperContents.filter((c) => c.section_type === sectionType).length + 1,
        };
        const { data, error } = await supabase.from("paper_contents").insert(newContent).select();
        if (error) throw error;
        setPaperContents((prev) => [...prev, data[0]]);
      }
      alert("Content saved successfully.");
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save content. Please try again.");
    }
  };

  const handleAddSection = (type: "section_heading" | "section_content") => {
    const newContent: PaperContent = {
      paper_id: parseInt(id as string),
      section_type: type,
      content: "",
      position: paperContents.filter((c) => c.section_type === type).length + 1,
    };
    setPaperContents((prev) => [...prev, newContent]);
  };

  const handleGenerateFormat = async () => {
    if (!selectedFormat || !paper) return;

    setLoading(true);
    try {
      const contentMap = paperContents.reduce((acc, content) => {
        if (!acc[content.section_type]) acc[content.section_type] = [];
        acc[content.section_type].push(content.content);
        return acc;
      }, {} as { [key in PaperContent["section_type"]]: string[] });

      const prompt = `
        Generate a formatted research paper for the topic: "${paper.topic}"
        Based on:
        - Paper Type: ${paper.paper_type}
        - Domain: ${paper.domain}
        - Status: ${paper.status}
        - Abstract: ${contentMap.abstract?.join("\n") || "No abstract"}
        - Introduction: ${contentMap.introduction?.join("\n") || "No introduction"}
        - Section Headings: ${contentMap.section_heading?.join("\n") || "No sections"}
        - Section Contents: ${contentMap.section_content?.join("\n") || "No section content"}
        - Conclusion: ${contentMap.conclusion?.join("\n") || "No conclusion"}
        - References: ${contentMap.references?.join("\n") || "No references"}

        Format the paper in ${selectedFormat} style (e.g., IEEE, APA, Springer). Return the full formatted document as plain text, including all sections, headings, and citations in the appropriate style.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });

      const formattedDoc = response.choices[0].message.content || "";
      setConvertedContent(formattedDoc);
      alert("Document formatted successfully. Check the content below.");
    } catch (error) {
      console.error("Error generating formatted document:", error);
      alert("Failed to generate formatted document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Loading research paper...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p>Research paper not found.</p>
      </div>
    );
  }

  const createdDate = new Date(paper.created_at).toLocaleDateString();

  return (
    <div className="min-h-screen flex flex-col">
      <Tabs defaultValue="info" className="flex-1">
        {/* Paper Navbar */}
        <nav className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Research Papers</span>
              </Button>
            </div>
            <TabsList>
              <TabsTrigger value="info">
                <Home className="h-4 w-4 mr-2" />
                Paper Info
              </TabsTrigger>
              <TabsTrigger value="details">
                <BookOpen className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="structure">
                <List className="h-4 w-4 mr-2" />
                Structure/Format
              </TabsTrigger>
              <TabsTrigger value="reminder">
                <Bell className="h-4 w-4 mr-2" />
                Reminder
              </TabsTrigger>
            </TabsList>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {/* Paper Title Box */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-300 to-blue-300">
            <h1 className="text-2xl font-bold text-white">{paper.topic}</h1>
          </div>

          {/* Tabbed Content */}
          <TabsContent value="info" className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Created on</p>
              <p className="text-lg font-medium">{createdDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paper Type</p>
              <p className="text-lg font-medium">{paper.paper_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="text-lg font-medium">{paper.domain}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-medium capitalize">{paper.status}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="default">Edit Paper</Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Abstract */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Abstract</h3>
              {paperContents.filter((c) => c.section_type === "abstract").map((content) => (
                <div key={content.id} className="mb-4">
                  <Textarea
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full h-24 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("abstract")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "abstract")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Introduction */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Introduction</h3>
              {paperContents.filter((c) => c.section_type === "introduction").map((content) => (
                <div key={content.id} className="mb-4">
                  <Textarea
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full h-24 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("introduction")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "introduction")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Section Headings and Contents */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Sections</h3>
              {paperContents.filter((c) => c.section_type === "section_heading").map((content) => (
                <div key={content.id} className="p-4 border rounded-lg mb-4">
                  <h4 className="text-md font-medium mb-2">Section Heading</h4>
                  <Input
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("section_heading")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "section_heading")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => handleAddSection("section_heading")}
                className="mb-4"
              >
                Add Section Heading
              </Button>

              {paperContents.filter((c) => c.section_type === "section_content").map((content) => (
                <div key={content.id} className="p-4 border rounded-lg mb-4">
                  <h4 className="text-md font-medium mb-2">Section Content</h4>
                  <Textarea
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full h-24 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("section_content")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "section_content")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => handleAddSection("section_content")}
                className="mb-4"
              >
                Add Section Content
              </Button>
            </div>

            {/* Conclusion */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Conclusion</h3>
              {paperContents.filter((c) => c.section_type === "conclusion").map((content) => (
                <div key={content.id} className="mb-4">
                  <Textarea
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full h-24 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("conclusion")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "conclusion")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* References */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">References</h3>
              {paperContents.filter((c) => c.section_type === "references").map((content) => (
                <div key={content.id} className="mb-4">
                  <Textarea
                    value={content.content}
                    onChange={(e) => setPaperContents((prev) =>
                      prev.map((c) => c.id === content.id ? { ...c, content: e.target.value } : c)
                    )}
                    className="w-full h-24 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAutoGenerate("references")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Auto Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckPlagiarism(content.content)}
                    >
                      Check Plagiarism
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleSaveContent(content.id, content.content, "references")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="default">Edit Paper</Button>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Structure/Format</h2>
              <p className="text-sm text-muted-foreground">Generate a formatted document for your research paper.</p>
            </div>
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
            <Button
              variant="default"
              onClick={handleGenerateFormat}
              disabled={!selectedFormat || loading}
            >
              {loading ? "Generating..." : "Generate Formatted Document"}
            </Button>
            {convertedContent && (
              <div className="mt-4 p-4 border rounded-lg">
                <Label>Formatted Document</Label>
                <Textarea
                  value={convertedContent}
                  readOnly
                  className="w-full h-64 mt-2"
                />
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reminder" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Reminder System</h2>
              <p className="text-sm text-muted-foreground">Set up productivity reminders for your research paper</p>
            </div>

            {/* Start Reminders Button */}
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white flex flex-col items-center">
              <Button
                variant="outline"
                className="w-48 bg-white text-gray-800 hover:bg-gray-100 mb-4"
                onClick={handleStartTimers}
              >
                {timerActive ? "Stop Reminders" : "Start Reminders"}
              </Button>
              <p className="text-sm text-gray-300">Click to start break and focus reminders</p>
            </div>

            {/* Session Duration */}
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2">Session Duration</h3>
              <p className="text-3xl font-bold">
                {Math.floor(sessionTime / 3600).toString().padStart(2, "0")}:
                {Math.floor((sessionTime % 3600) / 60).toString().padStart(2, "0")}:
                {(sessionTime % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-300 mt-2">Start the reminder system to begin tracking time</p>
            </div>

            {/* Break and Focus Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Break Reminder Settings */}
              <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white">
                <h3 className="text-lg font-semibold mb-4">Break Reminder Settings</h3>
                <div className="space-y-4">
                  <label className="text-sm text-gray-300">Reminder Interval</label>
                  <p className="text-sm text-gray-300">How often should we remind you to take a break?</p>
                  <Input
                    type="number"
                    min="10"
                    max="120"
                    value={breakInterval}
                    onChange={(e) => setBreakInterval(parseInt(e.target.value) || 40)}
                    className="w-24 bg-gray-700 text-white border-gray-600"
                  />
                  <p className="text-sm text-gray-300">
                    You will be reminded to take a break every {breakInterval} minutes while the timer is active.
                  </p>
                </div>
              </div>

              {/* Focus Reminder Settings */}
              <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white">
                <h3 className="text-lg font-semibold mb-4">Focus Reminder Settings</h3>
                <div className="space-y-4">
                  <label className="text-sm text-gray-300">Reminder Frequency</label>
                  <p className="text-sm text-gray-300">Set the interval range for focus reminders</p>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-gray-300">Minimum Interval</label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={focusMinInterval}
                        onChange={(e) => setFocusMinInterval(parseInt(e.target.value) || 5)}
                        className="w-24 bg-gray-700 text-white border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300">Maximum Interval</label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={focusMaxInterval}
                        onChange={(e) => setFocusMaxInterval(parseInt(e.target.value) || 10)}
                        className="w-24 bg-gray-700 text-white border-gray-600"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">
                    Focus reminders will appear randomly between {focusMinInterval}–{focusMaxInterval} minutes to help you stay on track.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}

function setConvertedContent(formattedDoc: string) {
    throw new Error("Function not implemented.");
}
