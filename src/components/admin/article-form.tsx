"use client";

import { useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUpload } from "@/components/admin/image-upload";
import { api } from "@/lib/api";

// Bakı vaxtını datetime-local formatına çevir
const getBakuDateTimeLocal = (): string => {
  const now = new Date();
  // Bakı vaxtını al (UTC+4)
  const bakuTime = formatInTimeZone(now, "Asia/Baku", "yyyy-MM-dd'T'HH:mm");
  return bakuTime;
};

const formSchema = z.object({
  title: z.string().min(6, "Başlıq çox qısadır"),
  slug: z.string().optional(),
  subTitle: z.string().optional(),
  keywords: z.string().optional(),
  content: z.string().min(10, "Kontent əlavə edin"),
  status: z.boolean(),
  publish: z.boolean(),
  hidden: z.boolean(),
  publishedDate: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "Ən azı 1 kateqoriya seçin"),
  imageUrl: z.string().optional(),
  videoEmbed: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
});

export type ArticleFormValues = z.infer<typeof formSchema>;

export type ArticleCategory = {
  id: string;
  title: string;
};

type ArticleFormProps = {
  postId?: string;
  defaultValues?: Partial<ArticleFormValues>;
  categories: ArticleCategory[];
};

export function ArticleForm({ postId, defaultValues, categories }: ArticleFormProps) {
  const router = useRouter();
  
  // Yeni məqalə yaradarkən (postId yoxdursa və defaultValues-də publishedDate yoxdursa) Bakı vaxtını default dəyər kimi təyin et
  const defaultPublishedDate = defaultValues?.publishedDate 
    ? defaultValues.publishedDate 
    : (!postId ? getBakuDateTimeLocal() : "");
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      slug: defaultValues?.slug || "",
      subTitle: defaultValues?.subTitle || "",
      keywords: defaultValues?.keywords || "",
      content: defaultValues?.content || "",
      status: defaultValues?.status ?? true,
      publish: defaultValues?.publish ?? true,
      hidden: defaultValues?.hidden !== undefined ? defaultValues.hidden : false,
      publishedDate: defaultValues?.publishedDate || defaultPublishedDate,
      categoryIds: defaultValues?.categoryIds || [],
      imageUrl: defaultValues?.imageUrl || "",
      videoEmbed: defaultValues?.videoEmbed || "",
      galleryImages: defaultValues?.galleryImages || [],
    },
  });

  const selectedCategories = form.watch("categoryIds");

  // defaultValues dəyişəndə form-u yenilə (yalnız bir dəfə, mount zamanı)
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (defaultValues && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Debug üçün console.log
      console.log("ArticleForm: Setting defaultValues", {
        galleryImages: defaultValues.galleryImages,
        galleryImagesLength: defaultValues.galleryImages?.length,
      });
      
      // Form-u reset et ki, defaultValues düzgün set olsun
      form.reset({
        title: defaultValues.title || "",
        slug: defaultValues.slug || "",
        subTitle: defaultValues.subTitle || "",
        keywords: defaultValues.keywords || "",
        content: defaultValues.content || "",
        status: defaultValues.status ?? true,
        publish: defaultValues.publish ?? true,
        hidden: defaultValues.hidden ?? false,
        publishedDate: defaultValues.publishedDate || defaultPublishedDate,
        categoryIds: defaultValues.categoryIds || [],
        imageUrl: defaultValues.imageUrl || "",
        videoEmbed: defaultValues.videoEmbed || "",
        galleryImages: defaultValues.galleryImages || [],
      });
    }
  }, [defaultValues, form, defaultPublishedDate]);

  const categoryMap = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        active: selectedCategories.includes(category.id),
      })),
    [categories, selectedCategories],
  );

  const onSubmit = async (values: ArticleFormValues) => {
    try {
      if (postId) {
        await api.put(`/admin/posts/${postId}`, values);
        toast.success("Məqalə yeniləndi");
        router.push("/dashboard/posts");
      } else {
        await api.post("/admin/posts", values);
        toast.success("Məqalə yaradıldı");
        router.push("/dashboard/posts");
      }
    } catch (error: any) {
      console.error("Form submit error:", error);
      const errorMessage = error.message || error.response?.data?.message || "Xəta baş verdi";
      toast.error(errorMessage);
    }
  };

  return (
    <form className="grid gap-6 lg:grid-cols-[2fr,1fr]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Başlıq</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="subTitle">Qısa təsvir</Label>
          <Textarea id="subTitle" rows={3} {...form.register("subTitle")} />
        </div>
        <div className="space-y-2">
          <Label>Məqalə mətni</Label>
          <Controller
            name="content"
            control={form.control}
            render={({ field }) => <RichTextEditor {...field} />}
          />
          {form.formState.errors.content && (
            <p className="text-sm text-destructive">
              {form.formState.errors.content.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <Label htmlFor="videoEmbed">Video embed kodu</Label>
            <p className="text-xs text-muted-foreground mt-1">
              YouTube, Vimeo və ya digər saytlardan embed kodunu buraya yapışdırın
            </p>
          </div>
          <Textarea
            id="videoEmbed"
            rows={6}
            placeholder='<iframe src="https://www.youtube.com/embed/..." width="560" height="315" frameborder="0" allowfullscreen></iframe>'
            {...form.register("videoEmbed")}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Form xətaları:</p>
              <ul className="mt-2 list-disc list-inside text-sm text-destructive">
                {form.formState.errors.title && (
                  <li>{form.formState.errors.title.message}</li>
                )}
                {form.formState.errors.content && (
                  <li>{form.formState.errors.content.message}</li>
                )}
                {form.formState.errors.categoryIds && (
                  <li>{form.formState.errors.categoryIds.message}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="sticky top-4 z-10">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting} 
            className="w-full gap-2"
            size="lg"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Yüklənir...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Saxla
              </>
            )}
          </Button>
        </div>
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <header>
            <p className="text-sm font-semibold">Yayımlanma</p>
            <p className="text-xs text-muted-foreground">Status və yayın rejimi</p>
          </header>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aktiv status</p>
              <p className="text-xs text-muted-foreground">Saytda görünməsi</p>
            </div>
            <Switch
              checked={form.watch("status")}
              onCheckedChange={(status: boolean) => form.setValue("status", status)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Yayımda</p>
              <p className="text-xs text-muted-foreground">Dərhal yayımla və ya qaralama</p>
            </div>
            <Switch
              checked={form.watch("publish")}
              onCheckedChange={(publish: boolean) => form.setValue("publish", publish)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Gizli xəbər</p>
              <p className="text-xs text-muted-foreground">Siyahılarda görünməsin, amma link ilə açıla bilsin</p>
            </div>
            <Switch
              checked={form.watch("hidden")}
              onCheckedChange={(hidden: boolean) => form.setValue("hidden", hidden)}
            />
          </div>
          {form.watch("publish") && (
            <div className="space-y-2">
              <Label htmlFor="publishedDate">Yayımlanma tarixi və saatı</Label>
              <Input
                id="publishedDate"
                type="datetime-local"
                value={form.watch("publishedDate") || ""}
                onChange={(e) => form.setValue("publishedDate", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Xəbərin yayımlanma tarixini və saatını müəyyən edin. Boş buraxsanız, cari tarix və saat istifadə olunacaq.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-2 rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Kateqoriyalar</p>
          <div className="flex flex-wrap gap-2">
            {categoryMap.map((category) => (
              <Badge
                key={category.id}
                variant={category.active ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => {
                  if (category.active) {
                    form.setValue(
                      "categoryIds",
                      selectedCategories.filter((id) => id !== category.id),
                    );
                  } else {
                    form.setValue("categoryIds", [...selectedCategories, category.id]);
                  }
                }}
              >
                {category.title}
              </Badge>
            ))}
          </div>
          {form.formState.errors.categoryIds && (
            <p className="text-sm text-destructive">
              {form.formState.errors.categoryIds.message}
            </p>
          )}
        </section>

        <section className="space-y-2 rounded-xl border bg-card p-4">
          <Label>Qalereya şəkilləri</Label>
          <Controller
            name="galleryImages"
            control={form.control}
            render={({ field }) => (
              <ImageUpload
                value={field.value || []}
                onChange={field.onChange}
                onMainImageChange={(url) => {
                  // Əsas şəkil seçildikdə imageUrl field-ini yenilə
                  form.setValue("imageUrl", url);
                }}
                multiple
                maxFiles={20}
                maxSizeMB={5}
              />
            )}
          />
        </section>
      </div>
    </form>
  );
}

