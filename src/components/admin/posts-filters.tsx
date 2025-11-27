"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = {
  id: string;
  title: string;
};

type Author = {
  id: string;
  name: string;
};

type Props = {
  initialSearch: string;
  initialPublish: string;
  initialCategory: string;
  initialAuthor: string;
  categories: Category[];
  authors: Author[];
};

export function PostsFilters({
  initialSearch,
  initialPublish,
  initialCategory,
  initialAuthor,
  categories,
  authors,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQuery = (key: string, value: string, options?: { keepAllValue?: boolean }) => {
    const next = new URLSearchParams(params);
    const shouldKeepAll = options?.keepAllValue && value === "all";
    if (value && (value !== "all" || shouldKeepAll)) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={initialSearch}
          placeholder="Başlıq üzrə axtar"
          className="pl-9"
          onChange={(event) => updateQuery("q", event.target.value)}
        />
      </div>
      <Select
        defaultValue={initialPublish || "live"}
        onValueChange={(value) => updateQuery("publish", value, { keepAllValue: true })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Yayımlanma filtri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Hamısı</SelectItem>
          <SelectItem value="live">Yayımda</SelectItem>
          <SelectItem value="draft">Qaralama</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={initialCategory || "all"}
        onValueChange={(value) => updateQuery("category", value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Kateqoriya" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={initialAuthor || "all"}
        onValueChange={(value) => updateQuery("author", value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Müəllif" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Bütün müəlliflər</SelectItem>
          {authors.map((author) => (
            <SelectItem key={author.id} value={author.id}>
              {author.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <p className="text-sm text-muted-foreground col-span-full">Yüklənir...</p>}
    </div>
  );
}

