import Link from "next/link";
import { Camera, Sparkles, TrendingUp, Send, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Camera,
    title: "צלם 2 תמונות",
    description: "צלם את הפריט מלפנים ותקריב של תווית או פרט מזהה",
  },
  {
    icon: Sparkles,
    title: "AI מנתח ומעריך",
    description: "הבינה המלאכותית מזהה את הפריט, מעריכה שווי וכותבת מודעה",
  },
  {
    icon: TrendingUp,
    title: "קבל טווח מחירים",
    description: "מכירה מהירה, מחיר ריאלי, ומחיר מקסימום - על סמך מחירי שוק",
  },
  {
    icon: Send,
    title: "פרסם בלחיצה",
    description: "מודעה מוכנה להדבקה ביד2, פייסבוק, או בשוק שמאי",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "זיהוי AI חכם",
    description: "מזהה מותג, דגם, מצב ואותנטיות מתמונות בלבד",
  },
  {
    icon: TrendingUp,
    title: "מחירי שוק אמיתיים",
    description: "מבוסס על סריקת מחירים מיד2 ופייסבוק מרקטפלייס",
  },
  {
    icon: Send,
    title: "מודעה מוכנה",
    description: "כותרת, תיאור, מפרט ומילות חיפוש - מוכן להדבקה",
  },
  {
    icon: ShieldCheck,
    title: "בטוח ואמין",
    description: "זיהוי זיופים, פריטים אסורים והגנה מהונאות",
  },
  {
    icon: Store,
    title: "שוק מובנה",
    description: "פרסם ומכור ישירות בפלטפורמה שלנו",
  },
  {
    icon: Camera,
    title: "שיפור מתמשך",
    description: "הוסף תמונות לשיפור דיוק ההערכה בכל שלב",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container flex flex-col items-center text-center py-20 md:py-32 gap-6 mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl">
            <span className="text-primary">שמאי</span>{" "}
            <span>AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-lg">
            צלם, קבל הערכת שווי ומודעת מכירה מוכנה תוך שניות
          </p>
          <div className="flex gap-3 mt-4">
            <Link href="/estimate">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                <Camera className="h-5 w-5" />
                התחל עכשיו
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 h-12 px-8 text-base"
              >
                <Store className="h-5 w-5" />
                לשוק
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-10">
          איך זה עובד?
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center space-y-3">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  שלב {i + 1}
                </div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            למה שמאי AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">
          מוכן למכור?
        </h2>
        <p className="text-muted-foreground mb-6">
          צלם את הפריט שלך וקבל הערכה תוך שניות. בחינם.
        </p>
        <Link href="/estimate">
          <Button size="lg" className="gap-2 h-12 px-8 text-base">
            <Sparkles className="h-5 w-5" />
            שמאי את זה!
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground mx-auto px-4">
          <p>
            &copy; {new Date().getFullYear()} שמאי AI. כל הזכויות שמורות.
          </p>
          <nav className="flex items-center gap-4">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              אודות
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-foreground transition-colors"
            >
              שוק
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
