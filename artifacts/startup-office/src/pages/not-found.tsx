import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-8 border border-white/5">
        <Bot className="w-10 h-10 text-muted-foreground opacity-50" />
      </div>
      <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">404 - Sector Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        This area of the office doesn't seem to exist. The architects might still be working on it.
      </p>
      <Link href="/" className="inline-block">
        <Button size="lg" className="rounded-full px-8">Return to Main Office</Button>
      </Link>
    </div>
  );
}
