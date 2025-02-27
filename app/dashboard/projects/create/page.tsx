"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BrainCircuit, Lightbulb } from "lucide-react"

export default function CreateProjectPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Choose an option to get started with your new project.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all hover:border-primary ${selectedOption === "quiz" ? "border-primary ring-2 ring-primary/20" : ""}`}
          onClick={() => setSelectedOption("quiz")}
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
            <Button
              variant={selectedOption === "quiz" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedOption("quiz")}
            >
              Start Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${selectedOption === "idea" ? "border-primary ring-2 ring-primary/20" : ""}`}
          onClick={() => setSelectedOption("idea")}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-primary" />I Have an Idea
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
            <Button
              variant={selectedOption === "idea" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedOption("idea")}
            >
              Create My Idea
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {selectedOption && (
        <div className="flex justify-end">
          <Button size="lg">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

