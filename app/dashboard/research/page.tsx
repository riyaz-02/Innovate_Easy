import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, CheckCircle, Clock, MoreHorizontal, Plus, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ResearchPage() {
  // Array of colors for research paper cards
  const cardColors = [
    { bg: "bg-purple-500/10", border: "border-purple-500/20", progress: "bg-purple-500" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/20", progress: "bg-indigo-500" },
    { bg: "bg-blue-500/10", border: "border-blue-500/20", progress: "bg-blue-500" },
    { bg: "bg-pink-500/10", border: "border-pink-500/20", progress: "bg-pink-500" },
    { bg: "bg-teal-500/10", border: "border-teal-500/20", progress: "bg-teal-500" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", progress: "bg-emerald-500" },
  ]

  return (
    <div className="space-y-8">
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => {
          const colorIndex = i % cardColors.length
          const colors = cardColors[colorIndex]

          return (
            <Card key={i} className={`overflow-hidden ${colors.bg} ${colors.border}`}>
              <CardHeader className="p-0">
                <div className={`h-3 ${colors.progress}`} />
                <div className="p-6 pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle>Research Paper {i + 1}</CardTitle>
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
                    A research paper on {i % 2 === 0 ? "artificial intelligence" : "machine learning"} and its
                    applications.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{Math.floor(Math.random() * 20) + 5} pages</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {i % 3 === 0 ? (
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
                      style={{
                        width: `${i % 3 === 0 ? 100 : Math.floor(Math.random() * 80) + 10}%`,
                      }}
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
          )
        })}
      </div>
    </div>
  )
}

