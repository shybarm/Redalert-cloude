"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ISRAELI_CITIES } from "@/lib/utils/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const handleSave = () => {
    toast.success("ההגדרות נשמרו");
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">הגדרות</h1>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">פרופיל</h2>

        <div>
          <Label htmlFor="name">שם</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלך"
          />
        </div>

        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="city">עיר ברירת מחדל</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="בחר עיר..."
            list="cities"
          />
          <datalist id="cities">
            {ISRAELI_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <Button onClick={handleSave}>שמור</Button>
      </Card>

      <Separator />

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">התראות</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded" />
            התראה על הודעה חדשה
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded" />
            התראה כשמודעה פגה תוקף
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="rounded" />
            עדכוני שוק ומחירים
          </label>
        </div>
      </Card>
    </div>
  );
}
