import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BookOpen, Brain, Newspaper } from "lucide-react";

const MATTERS_OF_THE_DAY = [
  {
    category: "Literature",
    icon: BookOpen,
    quote: "The only way out is through.",
    author: "Robert Frost",
    context: "From the poem 'A Servant to Servants' (1914)",
  },
  {
    category: "Philosophy",
    icon: Brain,
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    context: "Nicomachean Ethics",
  },
  {
    category: "Literature",
    icon: BookOpen,
    quote: "It is never too late to be what you might have been.",
    author: "George Eliot",
    context: "Victorian novelist and philosopher",
  },
  {
    category: "Philosophy",
    icon: Brain,
    quote: "The unexamined life is not worth living.",
    author: "Socrates",
    context: "Plato's Apology",
  },
  {
    category: "Current Events",
    icon: Newspaper,
    quote: "In the age of information, ignorance is a choice.",
    author: "Donny Miller",
    context: "On digital literacy and critical thinking",
  },
  {
    category: "Literature",
    icon: BookOpen,
    quote: "Not all those who wander are lost.",
    author: "J.R.R. Tolkien",
    context: "The Fellowship of the Ring",
  },
  {
    category: "Philosophy",
    icon: Brain,
    quote: "I think, therefore I am.",
    author: "René Descartes",
    context: "Discourse on the Method (1637)",
  },
  {
    category: "Literature",
    icon: BookOpen,
    quote: "Tomorrow, and tomorrow, and tomorrow, creeps in this petty pace from day to day.",
    author: "William Shakespeare",
    context: "Macbeth, Act 5, Scene 5",
  },
];

export function MatterOfTheDay() {
  // Get a consistent "random" matter based on the day of the year
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const matterIndex = dayOfYear % MATTERS_OF_THE_DAY.length;
  const matter = MATTERS_OF_THE_DAY[matterIndex];
  
  const Icon = matter.icon;

  return (
    <Card className="mb-6 border-primary/20" data-testid="matter-of-the-day">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Mikromatter of the Day
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded">
                {matter.category}
              </span>
            </div>
            <blockquote className="text-sm italic border-l-2 border-primary pl-3">
              "{matter.quote}"
            </blockquote>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">— {matter.author}</span>
              {matter.context && (
                <span className="ml-1">· {matter.context}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
