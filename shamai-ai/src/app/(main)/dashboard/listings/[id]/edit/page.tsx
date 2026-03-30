"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CONDITION_LABELS } from "@/types/estimation";
import type { ItemCondition } from "@/types/estimation";
import { ISRAELI_CITIES } from "@/lib/utils/constants";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    condition: "GOOD" as ItemCondition,
    selectedPrice: 0,
    city: "",
    selfPickup: true,
    courierAvailable: false,
  });

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setForm({
          title: data.title,
          description: data.description,
          condition: data.condition,
          selectedPrice: data.selectedPrice,
          city: data.city || "",
          selfPickup: data.selfPickup,
          courierAvailable: data.courierAvailable,
        });
      } catch {
        toast.error("מודעה לא נמצאה");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("המודעה עודכנה");
      router.push("/dashboard/listings");
    } catch {
      toast.error("שגיאה בעדכון");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">עריכת מודעה</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">כותרת</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="description">תיאור</Label>
          <Textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        <div>
          <Label>מצב</Label>
          <Select
            value={form.condition}
            onValueChange={(val) =>
              setForm((f) => ({ ...f, condition: val as ItemCondition }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">מחיר (אגורות)</Label>
          <Input
            id="price"
            type="number"
            value={form.selectedPrice}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                selectedPrice: parseInt(e.target.value) || 0,
              }))
            }
          />
        </div>

        <div>
          <Label htmlFor="city">עיר</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            list="cities"
          />
          <datalist id="cities">
            {ISRAELI_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.selfPickup}
              onChange={(e) =>
                setForm((f) => ({ ...f, selfPickup: e.target.checked }))
              }
            />
            איסוף עצמי
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.courierAvailable}
              onChange={(e) =>
                setForm((f) => ({ ...f, courierAvailable: e.target.checked }))
              }
            />
            שליח
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "שמור שינויים"
          )}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
