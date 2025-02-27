import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, BrainCircuit, FileText, Layers, Lightbulb, Rocket } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container">
        <MainNav />
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 hero-gradient">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Manage Your Projects & Research Papers Easily
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Streamline your workflow, organize your ideas, and accelerate your research with our comprehensive
                  management platform.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button size="lg" className="animate-in">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Everything You Need in One Place</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform provides all the tools you need to manage your projects and research papers efficiently.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Project Management</h3>
                <p className="text-center text-muted-foreground">
                  Create, organize, and track your projects with ease. Set milestones and monitor progress.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Research Papers</h3>
                <p className="text-center text-muted-foreground">
                  Manage your research papers, track citations, and collaborate with peers.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                <p className="text-center text-muted-foreground">
                  Get intelligent suggestions for project ideas and research topics based on your interests.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Project Creation Flow</h3>
                <p className="text-center text-muted-foreground">
                  Guided project creation with templates and AI-generated suggestions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Research Topic Search</h3>
                <p className="text-center text-muted-foreground">
                  Find relevant research topics and check for copyright issues before starting your work.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Templates</h3>
                <p className="text-center text-muted-foreground">
                  Use pre-designed templates for different types of projects and research papers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple and Intuitive Process</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform is designed to be easy to use, so you can focus on your work.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
              <div className="flex flex-col items-center space-y-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="text-xl font-bold">Sign Up</h3>
                <p className="text-center text-muted-foreground">
                  Create an account and set up your profile with your research interests.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="text-xl font-bold">Create Projects</h3>
                <p className="text-center text-muted-foreground">
                  Start creating projects or research papers using our guided flow.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="text-xl font-bold">Track Progress</h3>
                <p className="text-center text-muted-foreground">
                  Monitor your progress, set milestones, and achieve your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Get Started?</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Join thousands of researchers and project managers who are already using our platform.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

