import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, Users, GitBranch, Zap, Lock, Cloud } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-24 md:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center gap-8">
          <Badge variant="secondary" className="px-4 py-1">
            Architecture Diagrams Reimagined
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
            C4 Model Diagrams
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Create beautiful architecture diagrams with real-time collaboration.
            The ease of Miro meets the structure of Structurizr.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>✓ No credit card required</span>
            <span>✓ Free tier available</span>
            <span>✓ 3 diagrams included</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted">
        <div className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need for architecture diagrams
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for software architects, developers, and teams who care about documentation.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Layers className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>C4 Model Native</CardTitle>
              <CardDescription>
                Purpose-built for C4 diagrams with System Context, Container, Component, and Code levels.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Real-Time Collaboration</CardTitle>
              <CardDescription>
                Work together with your team in real-time. See cursors, edits, and changes instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Version Control Ready</CardTitle>
              <CardDescription>
                Export diagrams as JSON/YAML to commit alongside your code. Keep docs and code in sync.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built with modern web technologies for instant loading and smooth interactions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your diagrams are encrypted and secure. Control access with granular permissions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Cloud className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Cloud Sync</CardTitle>
              <CardDescription>
                Access your diagrams from anywhere. Automatic saving and cloud backup included.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center text-center gap-6 py-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl max-w-2xl">
              Ready to create better architecture diagrams?
            </h2>
            <p className="text-lg max-w-xl opacity-90">
              Join developers and architects who are already using 26 Diagrams to document their systems.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
                Start Diagramming Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
