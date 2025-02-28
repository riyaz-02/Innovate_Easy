"use client";

import { useState } from "react";
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
import { ArrowRight, BrainCircuit, BookOpen, Eye, Edit, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox component
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth"; // For reading .docx files
import axios from "axios"; // For API calls
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScholarResult {
  title: string;
  authors: string[];
  publication: string;
  year: number;
  link: string;
}

interface ResearchPaper {
  id: number;
  user_id: string;
  paper_type: string;
  domain: string;
  topic: string;
  status: "draft" | "published";
  created_at: string;
}

export default function CreateResearchPage() {
  const [researchQuizOpen, setResearchQuizOpen] = useState(false);
  const [researchQuizStep, setResearchQuizStep] = useState(0);
  const [researchData, setResearchData] = useState({
    paperType: "",
    domain: "",
    topic: "",
    customDomain: "", // For custom domain input
  });
  const [scholarSearchOpen, setScholarSearchOpen] = useState(false);
  const [formatPaperOpen, setFormatPaperOpen] = useState(false);
  const [checkResultsOpen, setCheckResultsOpen] = useState(false); // Modal for Scholar results
  const [scholarSearch, setScholarSearch] = useState("");
  const [scholarResults, setScholarResults] = useState<ScholarResult[]>([]);
  const [isFetchingScholar, setIsFetchingScholar] = useState(false);
  const [suggestedVenues, setSuggestedVenues] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [convertedContent, setConvertedContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [publishingCost, setPublishingCost] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false);
  const [checkedPapers, setCheckedPapers] = useState(false); // State for checkbox
  const [showConfirmCreate, setShowConfirmCreate] = useState(false); // Confirmation for creating paper
  const router = useRouter();

  const paperTypes = [
    { value: "journal", label: "Journal" },
    { value: "copyright", label: "Copyright" },
    { value: "patent", label: "Patent" },
    { value: "conference", label: "Conference" },
    { value: "thesis", label: "Thesis" },
    { value: "report", label: "Report" },
  ];

  const researchDomains = [
    { value: "computer_science", label: "Computer Science" },
    { value: "biology", label: "Biology" },
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "medicine", label: "Medicine" },
    { value: "engineering", label: "Engineering" },
    { value: "mathematics", label: "Mathematics" },
    { value: "social_sciences", label: "Social Sciences" },
  ];

  const handleResearchQuizNext = () => {
    if (researchQuizStep < 2) setResearchQuizStep(researchQuizStep + 1);
  };

  const handleResearchQuizPrevious = () => {
    if (researchQuizStep > 0) setResearchQuizStep(researchQuizStep - 1);
    else {
      setResearchQuizOpen(false);
      resetQuizState();
    }
  };

  const handleResearchQuizInput = (field: keyof typeof researchData, value: string) => {
    setResearchData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckPapers = async () => {
    if (researchData.topic) {
      setIsFetchingScholar(true); // Show "Checking..." while fetching
      await fetchScholarPapers(researchData.topic);
      setCheckResultsOpen(true);
    }
  };

  const handleContinueAfterCheck = () => {
    setCheckedPapers(true);
    setCheckResultsOpen(false);
    setResearchQuizOpen(true); // Reopen the quiz modal
  };

  const handleCreatePaper = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const paperData = {
        user_id: user.id,
        paper_type: researchData.paperType,
        domain: researchData.domain || researchData.customDomain, // Use custom domain if provided
        topic: researchData.topic,
        status: "draft" as const,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("research_papers").insert(paperData).select("id").single();
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      console.log("Research paper created successfully:", paperData);
      router.push("/dashboard/research"); // Redirect to research page to view the new paper
      resetAllModals();
    } catch (error) {
      console.error("Error creating research paper:", error);
      alert("Failed to create research paper. Please try again.");
    }
  };

  const fetchScholarPapers = async (query: string) => {
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

  const suggestVenues = () => {
    let suggestions: string[] = [];
    if (researchData.domain?.toLowerCase().includes("computer") || researchData.domain?.toLowerCase().includes("software")) {
      suggestions = ["IEEE Transactions", "Springer Computer Science", "arXiv"];
    } else if (researchData.domain?.toLowerCase().includes("biology") || researchData.domain?.toLowerCase().includes("health")) {
      suggestions = ["Nature", "PLOS ONE", "BioMed Central"];
    } else {
      suggestions = ["arXiv", "Springer Open", "Generic Open Access Journal"];
    }
    setSuggestedVenues(suggestions);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    onDrop: (acceptedFiles) => {
      setUploadedFile(acceptedFiles[0]);
    },
  });

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

  const saveEditedContent = () => {
    setConvertedContent(editedContent);
    console.log("Saved edited content:", editedContent);
  };

  const resetQuizState = () => {
    setResearchData({ paperType: "", domain: "", topic: "", customDomain: "" });
    setCheckedPapers(false);
  };

  const resetSearchState = () => {
    setScholarSearch("");
    setScholarResults([]);
  };

  const resetFormatState = () => {
    setSuggestedVenues([]);
    setSelectedVenue("");
    setSelectedFormat("");
    setUploadedFile(null);
    setConvertedContent("");
    setEditedContent("");
    setPublishingCost(null);
    setActiveTab("view");
  };

  const resetAllModals = () => {
    resetQuizState();
    resetSearchState();
    resetFormatState();
    setResearchQuizOpen(false);
    setCheckResultsOpen(false);
    setScholarSearchOpen(false);
    setFormatPaperOpen(false);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 overflow-y-auto h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Research Paper</h1>
        <p className="text-muted-foreground">Choose an option to start creating or managing your research paper.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card
          className={`cursor-pointer transition-all hover:border-primary ${
            researchQuizOpen ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => setResearchQuizOpen(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
              Take Research Paper Quiz
            </CardTitle>
            <CardDescription>Answer a few questions to generate research paper ideas for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI will analyze your preferences, experience, and interests to suggest tailored research paper ideas
              that match your goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={researchQuizOpen ? "default" : "outline"} className="w-full">
              Start Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${
            scholarSearchOpen ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => setScholarSearchOpen(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5 text-primary" />
              Search Research Paper
            </CardTitle>
            <CardDescription>Search for existing research papers to avoid duplication.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Search Google Scholar for published papers by title, author, or keyword to ensure originality.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={scholarSearchOpen ? "default" : "outline"} className="w-full">
              Search Papers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${
            formatPaperOpen ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => setFormatPaperOpen(true)}
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
              Choose a publication venue, and convert your work into a formatted document (e.g., IEEE, APA).
            </p>
          </CardContent>
          <CardFooter>
            <Button variant={formatPaperOpen ? "default" : "outline"} className="w-full">
              Start Formatting
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Research Quiz Modal */}
      <Dialog open={researchQuizOpen} onOpenChange={(open) => {
        if (!open) resetQuizState();
        setResearchQuizOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <div className="relative p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 left-0 bg-white/30 hover:bg-white/40 text-gray-800 rounded-full"
              onClick={() => setResearchQuizOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Back to Home</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>
              {researchQuizStep === 0 && "What type of paper are you creating?"}
              {researchQuizStep === 1 && "What is the domain of your research?"}
              {researchQuizStep === 2 && "What is your research topic?"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
            {researchQuizStep === 0 && (
              <div className="space-y-2">
                {paperTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      researchData.paperType === type.value ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => handleResearchQuizInput("paperType", type.value)}
                  >
                    <p className="font-medium">{type.label}</p>
                  </div>
                ))}
              </div>
            )}

            {researchQuizStep === 1 && (
              <div className="space-y-2">
                {researchDomains.map((domain) => (
                  <div
                    key={domain.value}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      researchData.domain === domain.value ? "border-primary bg-muted" : ""
                    }`}
                    onClick={() => handleResearchQuizInput("domain", domain.value)}
                  >
                    <p className="font-medium">{domain.label}</p>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add custom domain (if not listed)"
                  value={researchData.customDomain}
                  onChange={(e) => handleResearchQuizInput("customDomain", e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>
            )}

            {researchQuizStep === 2 && (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your research topic..."
                  value={researchData.topic}
                  onChange={(e) => handleResearchQuizInput("topic", e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {researchQuizStep < 2 && (
            <div className="flex justify-between mt-6 px-4 pb-4">
              <Button variant="outline" onClick={handleResearchQuizPrevious} disabled={researchQuizStep === 0}>
                Previous
              </Button>
              <Button variant="default" onClick={handleResearchQuizNext}>
                Next
              </Button>
            </div>
          )}

          {researchQuizStep === 2 && (
            <div className="flex justify-between mt-6 px-4 pb-4">
              <Button variant="outline" onClick={handleResearchQuizPrevious}>
                Previous
              </Button>
              {checkedPapers ? (
                <div className="space-x-2">
                  <Button
                    variant="default"
                    onClick={handleCheckPapers}
                    disabled={isFetchingScholar}
                  >
                    {isFetchingScholar ? "Checking..." : "Check"}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setShowConfirmCreate(true)}
                    disabled={!researchData.paperType || !researchData.domain || !researchData.topic}
                  >
                    Create Project
                  </Button>
                </div>
              ) : (
                <Button variant="default" onClick={handleCheckPapers} disabled={isFetchingScholar}>
                  {isFetchingScholar ? "Checking..." : "Check"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check Results Modal (for Scholar Papers) */}
      <Dialog open={checkResultsOpen} onOpenChange={(open) => {
        if (!open) {
          setScholarResults([]);
          setCheckedPapers(false);
        }
        setCheckResultsOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Published Research Papers</DialogTitle>
            <DialogDescription>Review these papers to ensure originality.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4">
            {scholarResults.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">No results found.</p>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkedPapers"
                checked={checkedPapers}
                onCheckedChange={(checked) => setCheckedPapers(checked as boolean)}
              />
              <Label htmlFor="checkedPapers" className="text-sm">
                I have checked the already published papers
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckResultsOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={handleContinueAfterCheck}
              disabled={!checkedPapers}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Paper Confirmation Dialog */}
      <Dialog open={showConfirmCreate} onOpenChange={(open) => {
        if (!open) setShowConfirmCreate(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Creation</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this research paper? This will save it as a draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmCreate(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleCreatePaper}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Research Paper Modal */}
      <Dialog open={scholarSearchOpen} onOpenChange={(open) => {
        if (!open) resetSearchState();
        setScholarSearchOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Research Papers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4">
            <Input
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={scholarSearch}
              onChange={(e) => setScholarSearch(e.target.value)}
              className="w-full"
            />
            <Button onClick={() => fetchScholarPapers(scholarSearch)} disabled={isFetchingScholar}>
              {isFetchingScholar ? "Searching..." : "Search"}
            </Button>
            {scholarResults.length > 0 && (
              <div className="mt-4">
                <p className="text-red-600 font-semibold">
                  Review these papers to avoid duplication and copyright issues.
                </p>
                <div className="grid gap-4 mt-2">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScholarSearchOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Format Research Paper Modal */}
      <Dialog open={formatPaperOpen} onOpenChange={(open) => {
        if (!open) resetFormatState();
        setFormatPaperOpen(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Format Research Paper</DialogTitle>
            <DialogDescription>
              Choose a publication venue, and convert your work into a formatted document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            
            { (
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
                <Button onClick={convertToFormat} className="mt-2" disabled={loading}>
                  {loading ? "Converting..." : `Convert to ${selectedFormat}`}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormatPaperOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}