import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const postSchema = z.object({
  title: z.string().min(6),
  slug: z.string().optional(),
  subTitle: z.string().optional(),
  keywords: z.string().optional(),
  content: z.string().min(4),
  status: z.boolean().optional().default(true),
  publish: z.union([z.boolean(), z.number()]).transform((value) =>
    typeof value === "number" ? value === 1 : value,
  ),
  hidden: z.boolean().optional().default(false),
  publishedDate: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  videoEmbed: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  quick: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    // İstifadəçinin rolunu yoxla - yalnız admin (role >= 2) silinmiş xəbərləri görə bilər
    const userRole = session.user?.role ?? 0;
    const isAdmin = userRole >= 2;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const search = searchParams.get("q") ?? undefined;
    const publish = searchParams.get("publish") ?? undefined;
    const categoryId = searchParams.get("category") ?? undefined;
    const authorId = searchParams.get("author") ?? undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true" && isAdmin;

    // Əgər limit kiçikdirsə (command palette üçün), sadə format qaytar
    const isSimpleFormat = limit <= 12;

    // Kateqoriya filteri üçün post ID-ləri tap
    let categoryPostIds: bigint[] = [];
    if (categoryId) {
      const categoryPosts = await prisma.category_post.findMany({
        where: { category_id: BigInt(categoryId) },
        select: { post_id: true },
      });
      categoryPostIds = categoryPosts.map((cp) => cp.post_id).filter(Boolean) as bigint[];
    }

    const postsWhereFilter = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                },
              },
              {
                sub_title: {
                  contains: search,
                },
              },
            ],
          }
        : {}),
      ...(publish === "draft"
        ? {
            publish: 0,
          }
        : publish === "live"
          ? {
              publish: 1,
            }
          : {}),
      ...(categoryId && categoryPostIds.length > 0
        ? {
            id: {
              in: categoryPostIds,
            },
          }
        : categoryId && categoryPostIds.length === 0
          ? {
              id: {
                in: [],
              },
            }
          : {}),
      ...(authorId
        ? {
            opened_user_id: Number(authorId),
          }
        : {}),
    };

    const fetchPostsFromDb = async (options?: { includeDeletedBy?: boolean }) => {
      const includeDeletedBy = options?.includeDeletedBy ?? true;
      const selectFields = isSimpleFormat
        ? { id: true, title: true }
        : {
            id: true,
            title: true,
            slug: true,
            publish: true,
            status: true,
            hidden: true,
            view_count: true,
            published_date: true,
            created_at: true,
            deleted_at: true,
            ...(includeDeletedBy ? { deleted_by: true } : {}),
            opened_user_id: true,
          };

      return prisma.posts.findMany({
        take: limit,
        where: postsWhereFilter,
        orderBy: [
          {
            published_date: {
              sort: "desc",
              nulls: "last",
            },
          },
          {
            created_at: "desc",
          },
        ],
        select: selectFields as any,
      });
    };

    const reconnectPrisma = async () => {
      try {
        await prisma.$disconnect();
      } catch {
        // ignore disconnect errors
      }
      await prisma.$connect();
    };

    let posts: any[] = [];
    try {
      posts = await fetchPostsFromDb();
    } catch (error: any) {
      const errorMessage = String(error.message || "");
      const errorCode = String(error.code || "");

      const isConnectionIssue =
        errorCode === "P1017" || errorMessage.includes("Server has closed the connection");

      if (isConnectionIssue) {
        console.warn("⚠️  Prisma connection closed (P1017). Yenidən qoşulmağa çalışıram...");
        try {
          await reconnectPrisma();
          posts = await fetchPostsFromDb();
        } catch (retryError) {
          console.error("❌ Prisma reconnect sonrası da alınmadı:", retryError);
          throw retryError;
        }
      }

      if (
        errorMessage.includes("deleted_by") ||
        errorMessage.includes("Unknown field") ||
        errorCode === "P2009" ||
        errorCode === "P2012" ||
        errorCode === "P2025"
      ) {
        console.log("⚠️  deleted_by field-i mövcud deyil, fallback edirəm...");
        posts = await fetchPostsFromDb({ includeDeletedBy: false });
      } else {
        throw error;
      }
    }

  // Müəllif məlumatlarını gətir
  const authorIds = posts
    .map((post) => (post as any).opened_user_id)
    .filter((id): id is number => id !== null && id !== undefined);

  const authors = authorIds.length > 0
    ? await prisma.users.findMany({
        where: {
          id: { in: authorIds.map((id) => BigInt(id)) },
        },
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      })
    : [];

  const authorMap = new Map(
    authors.map((author) => [
      Number(author.id),
      `${author.name} ${author.surname || ""}`.trim() || author.email || "Naməlum",
    ]),
  );

  if (isSimpleFormat) {
    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id.toString(),
        title: post.title,
      })),
    });
  }

  return NextResponse.json({
    posts: posts.map((post) => {
      const authorId = (post as any).opened_user_id;
      const authorName = authorId ? authorMap.get(authorId) || "Naməlum" : null;

      return {
        id: post.id.toString(),
        title: post.title,
        slug: (post as any).slug || null,
        publish: (post as any).publish,
        status: (post as any).status,
        hidden: (post as any).hidden ?? false,
        view_count:
          typeof (post as any).view_count === "bigint"
            ? Number((post as any).view_count)
            : (post as any).view_count || 0,
        published_date: (post as any).published_date
          ? new Date((post as any).published_date).toISOString()
          : null,
        created_at: (post as any).created_at
          ? new Date((post as any).created_at).toISOString()
          : null,
        deleted_at: (post as any).deleted_at
          ? new Date((post as any).deleted_at).toISOString()
          : null,
        deleted_by: (post as any).deleted_by ?? null,
        author: authorName,
      };
    }),
  });
  } catch (error: any) {
    console.error("GET /api/admin/posts error:", error);
    const errorMessage = error.message || "Server xətası baş verdi";
    const errorCode = error.code || "";
    
    // Daha detallı xəta mesajı
    let message = errorMessage;
    if (errorCode) {
      message = `${errorMessage} (Code: ${errorCode})`;
    }
    
    return NextResponse.json(
      { message, error: errorMessage, code: errorCode },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = postSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form məlumatları yanlışdır", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    let categoryIds = data.categoryIds ?? [];
    if (!categoryIds.length) {
      const fallback = await prisma.categories.findFirst({
        where: { deleted_at: null, status: true },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      if (fallback) {
        categoryIds = [fallback.id.toString()];
      }
    }

    if (!categoryIds.length) {
      return NextResponse.json(
        { message: "Kateqoriya tapılmadı. Əvvəlcə kateqoriya yaradın." },
        { status: 400 },
      );
    }

    const now = new Date();
    // publishedDate varsa, onu istifadə et, yoxsa cari tarix və saatı istifadə et
    let publishedDate: Date | null = null;
    if (data.publish) {
      if (data.publishedDate) {
        try {
          // datetime-local formatından Date obyektinə çevir
          // Format: YYYY-MM-DDTHH:mm
          const [datePart, timePart] = data.publishedDate.split("T");
          if (!datePart || !timePart) {
            throw new Error("Invalid date format");
          }
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes] = timePart.split(":").map(Number);

          // Validate date components
          if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
            throw new Error("Invalid date components");
          }

          // İstifadəçinin girdiyi tarix və saatı olduğu kimi saxla (timezone tətbiq etmirik)
          const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

          if (isNaN(localDate.getTime())) {
            throw new Error("Invalid date");
          }

          // Heç bir convertasiya etmədən istifadəçinin göndərdiyi vaxtı yadda saxla
          publishedDate = localDate;
        } catch (error) {
          console.error("Error parsing publishedDate:", error, data.publishedDate);
          publishedDate = now;
        }
      } else {
        publishedDate = now;
      }
    }

    // Debug: Constraint xətasını tapmaq üçün
    const publishValue = data.publish ? 1 : 0;
    console.log("Creating post with data:", {
      publish: publishValue,
      status: data.status ?? true,
      hidden: data.hidden ?? false,
      title_color: 0,
      count_show: 0,
      view_count: 0,
    });

    // Cari istifadəçinin ID-sini al
    const userId = session.user?.id ? Number(session.user.id) : null;

    // opened_user_id field-i database-də yoxdursa, onu çıxarırıq
    const postData: any = {
      title: data.title,
      slug: data.slug && data.slug.length > 1 ? data.slug : slugify(data.title),
      sub_title: data.subTitle,
      keywords: data.keywords,
      seo_keyword: data.keywords,
      content: data.content,
      status: data.status ?? true,
      publish: publishValue,
      hidden: data.hidden ?? false,
      // image_url boşdursa, default dəyəri istifadə et
      image_url: data.imageUrl || "iqtisadiyyat_logo_yasil-min.png",
      youtube_link: data.videoEmbed,
      // Default dəyərləri set et
      title_color: 0,
      count_show: 0,
      view_count: BigInt(0),
      created_at: now,
      updated_at: now,
      published_date: publishedDate,
    };

    // Constraint xətasını qarşısını almaq üçün, opened_user_id-ni çıxar
    // Post yaradıldıqdan sonra ayrıca update edəcəyik
    const postDataFinal = { ...postData };
    delete postDataFinal.opened_user_id;
    
    // Post-u opened_user_id olmadan yarad
    let post;
    try {
      post = await prisma.posts.create({
        data: postDataFinal,
      });
    } catch (createError: any) {
      // Əgər constraint xətası varsa, minimal field-lərlə yenidən yoxla
      const errorMessage = String(createError.message || "");
      
      if (errorMessage.includes("posts_chk_1") || errorMessage.includes("Check constraint")) {
        console.log("⚠️  posts_chk_1 constraint xətası, minimal field-lərlə yenidən yoxlayıram...");
        
        // Minimal field-lərlə yarad (yalnız məcburi field-lər: title, content, status, publish)
        const minimalPostData: any = {
          title: data.title,
          content: data.content || "<p></p>",
          status: data.status ?? true,
          publish: publishValue,
          // Default dəyərlər
          title_color: 0,
          count_show: 0,
          view_count: BigInt(0),
          hidden: data.hidden ?? false,
          created_at: now,
          updated_at: now,
        };
        
        // Optional field-lər (yalnız varsa)
        if (data.slug && data.slug.length > 1) {
          minimalPostData.slug = data.slug;
        } else {
          minimalPostData.slug = slugify(data.title);
        }
        
        if (data.imageUrl) {
          minimalPostData.image_url = data.imageUrl;
        } else {
          minimalPostData.image_url = "iqtisadiyyat_logo_yasil-min.png";
        }
        
        // published_date yalnız publish true-dursa
        if (publishedDate) {
          minimalPostData.published_date = publishedDate;
        }
        
        post = await prisma.posts.create({
          data: minimalPostData,
        });
        
        // Qalan field-ləri update et (constraint xətasını qarşısını almaq üçün try-catch)
        // Yalnız null/undefined olmayan field-ləri update et
        const updateData: any = {};
        
        if (data.subTitle !== undefined && data.subTitle !== null && data.subTitle !== "") {
          updateData.sub_title = data.subTitle;
        }
        
        if (data.keywords !== undefined && data.keywords !== null && data.keywords !== "") {
          updateData.keywords = data.keywords;
          updateData.seo_keyword = data.keywords;
        }
        
        if (data.videoEmbed !== undefined && data.videoEmbed !== null && data.videoEmbed !== "") {
          updateData.youtube_link = data.videoEmbed;
        }
        
        // Update etməyə çalış (xəta olarsa, ignore et)
        if (Object.keys(updateData).length > 0) {
          try {
            await prisma.posts.update({
              where: { id: post.id },
              data: updateData,
            });
          } catch (updateError: any) {
            // Əgər update xətası varsa (constraint ola bilər), ignore et
            console.log("⚠️  Field-ləri update edərkən xəta (ignore olunur):", updateError.message);
            // Xətanı throw etmə - post artıq yaradılıb
          }
        }
      } else {
        throw createError;
      }
    }
    
    // Əgər userId varsa, onu ayrıca update et
    if (userId !== null) {
      try {
        await prisma.posts.update({
          where: { id: post.id },
          data: { opened_user_id: userId },
        });
      } catch (updateError: any) {
        // Əgər update xətası varsa, bu normaldır - constraint ola bilər
        console.log("⚠️  opened_user_id update xətası (normal ola bilər):", updateError.message);
      }
    }

    // Parallel olaraq category_post və gallery images əlavə et
    const promises: Promise<any>[] = [
      prisma.category_post.createMany({
        data: categoryIds.map((categoryId) => ({
          post_id: post.id,
          category_id: BigInt(categoryId),
          created_at: now,
          updated_at: now,
        })),
        skipDuplicates: true,
      }),
    ];

    if (data.galleryImages && data.galleryImages.length > 0) {
      // İlk şəkli əsas şəkil kimi təyin et (əgər imageUrl boşdursa və ya ilk şəkil fərqlidirsə)
      const firstGalleryImage = data.galleryImages[0];
      if (firstGalleryImage && (!data.imageUrl || data.imageUrl !== firstGalleryImage)) {
        promises.push(
          prisma.posts.update({
            where: { id: post.id },
            data: { image_url: firstGalleryImage },
          })
        );
      }

      promises.push(
        prisma.post_galeries.createMany({
          data: data.galleryImages.map((imageUrl: string) => ({
            post_id: Number(post.id),
            name: imageUrl,
            created_at: now,
            updated_at: now,
          })),
          skipDuplicates: true,
        })
      );
    }

    // Bütün promise-ləri parallel olaraq gözlə
    await Promise.all(promises);

    return NextResponse.json({ id: post.id.toString() }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/posts error:", error);
    const errorMessage = error.message || "Server xətası baş verdi";
    const errorCode = error.code || "";
    
    // Daha detallı xəta mesajı
    let message = errorMessage;
    if (errorCode) {
      message = `${errorMessage} (Code: ${errorCode})`;
    }
    
    return NextResponse.json(
      {
        message,
        error: errorMessage,
        code: errorCode,
      },
      { status: 500 },
    );
  }
}

