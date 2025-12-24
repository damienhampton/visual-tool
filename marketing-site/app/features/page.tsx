import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layers, Users, GitBranch, Zap, Lock, Cloud,
  Download, Upload, Palette, Grid, History, Share2
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: Layers,
      title: "C4 Model Native",
      description: "Purpose-built for creating C4 architecture diagrams with System Context, Container, Component, and Code levels. Strict element types ensure consistency."
    },
    {
      icon: Users,
      title: "Real-Time Collaboration",
      description: "Work together with your team in real-time. See cursors, edits, and changes instantly. Perfect for remote teams and pair programming sessions."
    },
    {
      icon: GitBranch,
      title: "Version Control Ready",
      description: "Export diagrams as JSON/YAML files to commit alongside your code. Keep your documentation in sync with your codebase using Git."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built with React Flow and modern web technologies for instant loading and smooth interactions. No lag, even with complex diagrams."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your diagrams are encrypted and secure. Control access with granular permissions. Share with team members or generate guest links."
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Access your diagrams from anywhere. Automatic saving ensures you never lose work. Cloud backup keeps your data safe."
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Export diagrams as PNG, SVG, or JSON. Perfect for documentation, presentations, or version control."
    },
    {
      icon: Upload,
      title: "Import & Generate",
      description: "Import existing diagrams or generate them from code. Support for Terraform, ADRs, and other infrastructure-as-code formats (coming soon)."
    },
    {
      icon: Palette,
      title: "Customizable Styling",
      description: "Customize colors, shapes, and styles to match your brand or preferences. Create beautiful diagrams that stand out."
    },
    {
      icon: Grid,
      title: "Smart Alignment",
      description: "Snap-to-grid, auto-layout, and grouping features help you create clean, organized diagrams quickly."
    },
    {
      icon: History,
      title: "Version History",
      description: "Track changes over time with automatic version snapshots. Restore previous versions or compare changes."
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description: "Generate shareable links for guest access. Control permissions with owner, editor, and viewer roles."
    }
  ];

  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Powerful features for architecture diagrams
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to create, collaborate, and maintain professional C4 model diagrams.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <feature.icon className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
