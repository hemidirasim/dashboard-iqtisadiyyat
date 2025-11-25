"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  order: z.string().optional(),
  home: z.boolean().optional(),
  content: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function CategoryForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      order: undefined,
      home: false,
      content: "",
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      const payload = {
        ...values,
        order: values.order ? Number(values.order) : undefined,
      };
      await api.post("/admin/categories", payload);
      toast.success("Kateqoriya əlavə edildi");
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form className="space-y-4 rounded-xl border bg-card p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="title">Başlıq</Label>
        <Input id="title" {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...form.register("slug")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="order">Sıra</Label>
          <Input id="order" type="number" {...form.register("order")} />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Əsas səhifədə</p>
            <p className="text-xs text-muted-foreground">Ana səhifəyə çıxar</p>
          </div>
          <Switch
            checked={form.watch("home")}
            onCheckedChange={(value) => form.setValue("home", value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Açıqlama</Label>
        <Textarea id="content" rows={3} {...form.register("content")} />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Yüklənir...
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Əlavə et
          </>
        )}
      </Button>
    </form>
  );
}

