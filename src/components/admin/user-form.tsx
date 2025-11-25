"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/constants";

const createUserSchema = z.object({
  name: z.string().min(2, "Ad çox qısadır"),
  surname: z.string().optional(),
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin"),
  password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır"),
  role: z.number().int().min(0).max(2),
  status: z.boolean(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Ad çox qısadır"),
  surname: z.string().optional(),
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin"),
  password: z
    .string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır")
    .optional()
    .or(z.literal("")),
  role: z.number().int().min(0).max(2),
  status: z.boolean(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
type UserFormValues = CreateUserFormValues | UpdateUserFormValues;

type UserFormProps = {
  userId?: string;
  defaultValues?: Partial<UserFormValues & { password?: string }>;
};

export function UserForm({ userId, defaultValues }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!userId;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      role: 0,
      status: true,
      ...defaultValues,
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    try {
      const payload: any = { ...values };
      
      // Edit modunda şifrə boş ola bilər (dəyişdirilməyibsə)
      if (isEdit && (!payload.password || payload.password === "")) {
        delete payload.password;
      }

      if (userId) {
        await api.put(`/admin/users/${userId}`, payload);
        toast.success("İstifadəçi yeniləndi");
      } else {
        await api.post("/admin/users", payload);
        toast.success("İstifadəçi yaradıldı");
        router.push("/dashboard/users");
        return;
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Xəta baş verdi");
    }
  };

  return (
    <form className="grid gap-6 lg:grid-cols-[2fr,1fr]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ad *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Soyad</Label>
          <Input id="surname" {...form.register("surname")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-poçt *</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Şifrə {isEdit ? "(dəyişdirmək istəmirsinizsə boş buraxın)" : "*"}
          </Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2">
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
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <header>
            <p className="text-sm font-semibold">Rol və Status</p>
            <p className="text-xs text-muted-foreground">İstifadəçi icazələri</p>
          </header>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={form.watch("role").toString()}
              onValueChange={(value) => form.setValue("role", Number(value))}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Reporter</SelectItem>
                <SelectItem value="1">Editor</SelectItem>
                <SelectItem value="2">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[form.watch("role")] === "reporter" && "Yalnız məqalə yarada bilər"}
              {ROLE_LABEL[form.watch("role")] === "editor" && "Məqalə yarada və redaktə edə bilər"}
              {ROLE_LABEL[form.watch("role")] === "admin" && "Tam icazələr"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aktiv status</p>
              <p className="text-xs text-muted-foreground">İstifadəçi aktivdir</p>
            </div>
            <Switch
              checked={form.watch("status")}
              onCheckedChange={(status: boolean) => form.setValue("status", status)}
            />
          </div>
        </section>
      </div>
    </form>
  );
}

