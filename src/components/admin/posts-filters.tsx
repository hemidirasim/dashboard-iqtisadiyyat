"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [searchValue, setSearchValue] = useState(initialSearch);

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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    updateQuery("q", searchValue);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            placeholder="Başlıq üzrə axtar"
            className="pl-9"
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <Button type="submit" size="sm" variant="outline">
          Axtar
        </Button>
      </form>
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

