import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BrainCircuit, FileText, Layers, Lightbulb, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, User } from "lucide-react"; // Added for developer cards

export default function Home() {
  // Developer data (example; replace with actual developer details)
  const developers = [
    {
      name: "John Doe",
      role: "Lead Developer",
      image: "/path/to/john.jpg", // Replace with actual image path or URL
      description: "Expert in full-stack development with over 10 years of experience.",
    },
    {
      name: "Jane Smith",
      role: "UI/UX Designer",
      image: "/path/to/jane.jpg", // Replace with actual image path or URL
      description: "Creative designer specializing in user-centered interfaces.",
    },
    {
      name: "Alex Johnson",
      role: "Backend Engineer",
      image: "/path/to/alex.jpg", // Replace with actual image path or URL
      description: "Skilled in building scalable backend systems and APIs.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="container z-50">
        <MainNav />
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 relative bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-b-lg shadow-lg overflow-hidden">
          <div className="container px-4 md:px-8 lg:px-16 max-w-screen-xl relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center animate-fadeIn">
              <div className="space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl/none">
                  Manage Your Projects & Research Papers Easily
                </h1>
                <p className="mx-auto max-w-[800px] text-lg md:text-xl font-medium">
                  Streamline your workflow, organize your ideas, and accelerate your research with our comprehensive
                  management platform.
                </p>
              </div>
              <div className="space-x-6">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-md transform hover:scale-105 transition-transform duration-300">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/20 hover:text-white">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="mt-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-semibold text-white animate-pulse shadow-md">
                  Developed at InnovoCon 2k25 by Team Techternity
                </span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 animate-pulse">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 Q50,0 100,100" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-8 lg:px-16">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm font-medium text-primary animate-slideIn">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-gray-900 dark:text-gray-100">
                  Everything You Need in One Place
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform provides all the tools you need to manage your projects and research papers efficiently.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">Project Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create, organize, and track your projects with ease. Set milestones and monitor progress.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-200">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">Research Papers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Manage your research papers, track citations, and collaborate with peers.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-400">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get intelligent suggestions for project ideas and research topics based on your interests.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-600">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">Project Creation Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Guided project creation with templates and AI-generated suggestions.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-800">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">Research Topic Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Find relevant research topics and check for copyright issues before starting your work.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-1000">
                <CardHeader className="flex items-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold ml-4 text-primary">Smart Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Use pre-designed templates for different types of projects and research papers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-8 lg:px-16">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm font-medium text-primary animate-slideIn">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-gray-900 dark:text-gray-100">
                  Simple and Intuitive Process
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform is designed to be easy to use, so you can focus on your work.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
              <div className="flex flex-col items-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sign Up</h3>
                <p className="text-center text-muted-foreground">
                  Create an account and set up your profile with your research interests.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Projects</h3>
                <p className="text-center text-muted-foreground">
                  Start creating projects or research papers using our guided flow.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Track Progress</h3>
                <p className="text-center text-muted-foreground">
                  Monitor your progress, set milestones, and achieve your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="container px-4 md:px-8 lg:px-16">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Ready to Get Started?
                </h2>
                <p className="max-w-[700px] text-lg md:text-xl font-medium">
                  Join thousands of researchers and project managers who are already using our platform.
                </p>
              </div>
              <div className="space-x-6">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-md transform hover:scale-105 transition-transform duration-300">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/20 hover:text-white">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Section */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-8 lg:px-16">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm font-medium text-primary animate-slideIn">
                  Our Team
                </div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-gray-900 dark:text-gray-100">
                  Meet Our Developers
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  The brilliant minds behind this platform, driving innovation at InnovoCon 2k25.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
              <Card className="border-blue-500/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn">
                <CardHeader className="flex flex-col items-center">
                  <img src={developers[0].image} alt={developers[0].name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md" />
                  <CardTitle className="text-xl font-semibold text-blue-700 dark:text-blue-300">{developers[0].name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{developers[0].role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-700 dark:text-gray-200">{developers[0].description}</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="outline" size="sm" className="hover:bg-blue-100 dark:hover:bg-blue-800">
                    <Code className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
              <Card className="border-purple-500/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-200">
                <CardHeader className="flex flex-col items-center">
                  <img src={developers[1].image} alt={developers[1].name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md" />
                  <CardTitle className="text-xl font-semibold text-purple-700 dark:text-purple-300">{developers[1].name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{developers[1].role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-700 dark:text-gray-200">{developers[1].description}</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="outline" size="sm" className="hover:bg-purple-100 dark:hover:bg-purple-800">
                    <Code className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
              <Card className="border-green-500/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-2 animate-fadeIn delay-400">
                <CardHeader className="flex flex-col items-center">
                  <img src={developers[2].image} alt={developers[2].name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md" />
                  <CardTitle className="text-xl font-semibold text-green-700 dark:text-green-300">{developers[2].name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{developers[2].role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-700 dark:text-gray-200">{developers[2].description}</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="outline" size="sm" className="hover:bg-green-100 dark:hover:bg-green-800">
                    <Code className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center rounded-t-lg shadow-lg">
        <p className="text-lg font-semibold animate-bounce">
          Developed at InnovoCon 2k25 by Team Techternity
        </p>
      </footer>
    </div>
  );
}