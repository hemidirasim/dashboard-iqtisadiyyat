"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PenSquare } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(6, "Başlıq ən azı 6 simvol olmalıdır"),
  summary: z.string().min(12, "Qısa təsvir daxil edin"),
  categoryId: z.string().min(1, "Kateqoriya seçin"),
});

type FormValues = z.infer<typeof schema>;

type CategoryOption = {
  id: string;
  title: string;
};

export function QuickCreateDrawer() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      categoryId: "",
    },
  });

  useEffect(() => {
    if (!open || categories.length) return;
    setIsLoadingCategories(true);
    api
      .get("/admin/categories?lite=1")
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setIsLoadingCategories(false));
  }, [open, categories.length]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/admin/posts", {
        title: values.title,
        subTitle: values.summary,
        content: `<p>${values.summary}</p>`,
        keywords: "",
        publish: 0,
        status: true,
        quick: true,
        categoryIds: [values.categoryId],
      });
      toast.success("Qısa xəbər yaradıldı");
      reset();
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <PenSquare className="size-4" />
          Tez xəbər
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-3xl bg-background p-6 shadow-2xl">
          <Drawer.Title className="sr-only">Tez xəbər yarat</Drawer.Title>
          <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-muted" />
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="quick-title">Başlıq</Label>
              <Input id="quick-title" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-summary">Qısa təsvir</Label>
              <Textarea rows={4} id="quick-summary" {...register("summary")} />
              {errors.summary && (
                <p className="text-sm text-destructive">{errors.summary.message}</p>
              )}
            </div>
        <div className="space-y-2">
          <Label>Kateqoriya</Label>
          <Select value={watch("categoryId")} onValueChange={(value) => setValue("categoryId", value)}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingCategories ? "Yüklənir..." : "Seçin"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Yaradılır...
                </>
              ) : (
                "Yarat və davam et"
              )}
            </Button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

