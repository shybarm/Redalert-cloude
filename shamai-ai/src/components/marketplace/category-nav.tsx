"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/utils/constants";
import {
  Monitor,
  Smartphone,
  Laptop,
  Armchair,
  Shirt,
  Dumbbell,
  Baby,
  BookOpen,
  Music,
  Gamepad2,
  Car,
  Gem,
  Wrench,
  TreePine,
  Package,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Monitor,
  Smartphone,
  Laptop,
  Armchair,
  Refrigerator: Zap,
  Shirt,
  Dumbbell,
  Baby,
  BookOpen,
  Music,
  Gamepad2,
  Car,
  Gem,
  Wrench,
  TreePine,
  Package,
};

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Link href="/marketplace">
          <Button
            variant={pathname === "/marketplace" ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0"
          >
            הכל
          </Button>
        </Link>
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Package;
          const isActive = pathname === `/marketplace/${cat.slug}`;
          return (
            <Link key={cat.slug} href={`/marketplace/${cat.slug}`}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn("shrink-0 gap-1.5", isActive && "font-semibold")}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.nameHe}
              </Button>
            </Link>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
