import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { purgePostCache, purgeAllCloudflareCache } from "@/lib/cloudflare";

const updateSchema = z.object({
  title: z.string().min(6),
  slug: z.string().optional(),
  subTitle: z.string().optional(),
  keywords: z.string().optional(),
  content: z.string().min(4),
  status: z.boolean(),
  publish: z.boolean(),
  hidden: z.boolean().optional().default(false),
  publishedDate: z.string().optional(),
  categoryIds: z.array(z.string()).min(1),
  imageUrl: z.string().optional(),
  videoEmbed: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  titleColor: z.number().optional().default(0),
});

type Params = {
  params: Promise<{ postId: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form məlumatları yanlışdır", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const { postId } = await params;
    const id = BigInt(postId);
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

        // İstifadəçinin girdiyi tarix və saatı olduğu kimi UTC kimi saxla
        // Form-da Bakı vaxtı göstərilir, amma bazaya yazarkən UTC kimi saxla (heç bir çevirmə olmadan)
        // Format: YYYY-MM-DDTHH:mm -> UTC Date (heç bir timezone offset olmadan)
        // Date.UTC() istifadə edərək tarixi UTC kimi yaradırıq (heç bir çevirmə olmadan)
        const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0);
        const utcDate = new Date(utcTimestamp);

        if (isNaN(utcDate.getTime())) {
          throw new Error("Invalid date");
        }

        // Tarixi UTC kimi saxla (heç bir çevirmə olmadan)
        publishedDate = utcDate;
      } catch (error) {
        console.error("Error parsing publishedDate:", error, data.publishedDate);
        // Fallback: use current date
        publishedDate = now;
      }
    } else {
      publishedDate = now;
    }
  }

    // Update data - yalnız dəyərləri olan field-ləri əlavə et
    const updateData: any = {
      title: data.title,
      content: data.content,
      status: data.status,
      publish: data.publish ? 1 : 0,
      hidden: data.hidden ?? false,
      updated_at: now,
    };

    // Optional field-lər
    if (data.slug && data.slug.length > 1) {
      updateData.slug = data.slug;
    } else {
      updateData.slug = slugify(data.title);
    }

    // subTitle həmişə update et (boş string də ola bilər)
    if (data.subTitle !== undefined) {
      updateData.sub_title = data.subTitle || null;
    }

    if (data.keywords !== undefined && data.keywords !== null) {
      updateData.keywords = data.keywords;
      updateData.seo_keyword = data.keywords;
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      updateData.image_url = data.imageUrl;
    }

    if (data.videoEmbed !== undefined && data.videoEmbed !== null) {
      updateData.youtube_link = data.videoEmbed;
    }

    if (data.titleColor !== undefined && data.titleColor !== null) {
      updateData.title_color = data.titleColor;
    }

    if (publishedDate) {
      updateData.published_date = publishedDate;
    }

    let updatedPost;
    try {
      updatedPost = await prisma.posts.update({
        where: { id },
        data: updateData,
      });
    } catch (updateError: any) {
      // Əgər constraint xətası varsa, minimal field-lərlə yenidən yoxla
      const errorMessage = String(updateError.message || "");
      
      if (errorMessage.includes("posts_chk_1") || errorMessage.includes("Check constraint")) {
        console.log("⚠️  posts_chk_1 constraint xətası, minimal field-lərlə yenidən yoxlayıram...");
        
        // Minimal field-lərlə update et (yalnız məcburi field-lər)
        const minimalUpdateData: any = {
          title: data.title,
          content: data.content,
          status: data.status,
          publish: data.publish ? 1 : 0,
          hidden: data.hidden ?? false,
          updated_at: now,
        };
        
        // Slug yalnız varsa
        if (data.slug && data.slug.length > 1) {
          minimalUpdateData.slug = data.slug;
        } else {
          minimalUpdateData.slug = slugify(data.title);
        }
        
        // published_date yalnız publish true-dursa
        if (publishedDate) {
          minimalUpdateData.published_date = publishedDate;
        }
        
        updatedPost = await prisma.posts.update({
          where: { id },
          data: minimalUpdateData,
        });
        
        // Qalan field-ləri ayrıca update et (constraint xətasını qarşısını almaq üçün)
        const additionalUpdateData: any = {};
        
        // subTitle həmişə update et (boş string də ola bilər)
        if (data.subTitle !== undefined) {
          additionalUpdateData.sub_title = data.subTitle || null;
        }
        
        if (data.keywords !== undefined && data.keywords !== null && data.keywords !== "") {
          additionalUpdateData.keywords = data.keywords;
          additionalUpdateData.seo_keyword = data.keywords;
        }
        
        if (data.imageUrl !== undefined && data.imageUrl !== null) {
          additionalUpdateData.image_url = data.imageUrl;
        }
        
        if (data.videoEmbed !== undefined && data.videoEmbed !== null) {
          additionalUpdateData.youtube_link = data.videoEmbed;
        }
        
        if (data.titleColor !== undefined && data.titleColor !== null) {
          additionalUpdateData.title_color = data.titleColor;
        }
        
        // Update etməyə çalış (xəta olarsa, ignore et)
        if (Object.keys(additionalUpdateData).length > 0) {
          try {
            await prisma.posts.update({
              where: { id },
              data: additionalUpdateData,
            });
          } catch (additionalError: any) {
            // Əgər update xətası varsa (constraint ola bilər), ignore et
            console.log("⚠️  Əlavə field-ləri update edərkən xəta (ignore olunur):", additionalError.message);
          }
        }
      } else {
        throw updateError;
      }
    }

  // Parallel olaraq category_post və gallery images update et
  const promises: Promise<any>[] = [
    prisma.category_post.deleteMany({
      where: { post_id: id },
    }),
  ];

  promises.push(
    prisma.category_post.createMany({
      data: data.categoryIds.map((categoryId) => ({
        post_id: id,
        category_id: BigInt(categoryId),
        created_at: now,
        updated_at: now,
      })),
    })
  );

  promises.push(
    prisma.post_galeries.deleteMany({
      where: { post_id: Number(id) },
    })
  );

  if (data.galleryImages && data.galleryImages.length > 0) {
    // İlk şəkli əsas şəkil kimi təyin et (əgər imageUrl boşdursa və ya ilk şəkil fərqlidirsə)
    const firstGalleryImage = data.galleryImages[0];
    if (firstGalleryImage && (!data.imageUrl || data.imageUrl !== firstGalleryImage)) {
      promises.push(
        prisma.posts.update({
          where: { id },
          data: { image_url: firstGalleryImage },
        })
      );
    }

    promises.push(
      prisma.post_galeries.createMany({
        data: data.galleryImages.map((imageUrl: string) => ({
          post_id: Number(id),
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

    // Cloudflare cache-i purge et
    await purgePostCache(updatedPost.id.toString(), updatedPost.slug || null).catch((error) => {
      console.error("Failed to purge Cloudflare cache:", error);
    });

    return NextResponse.json({ id: updatedPost.id.toString() });
  } catch (error: any) {
    console.error("PUT /api/admin/posts/[postId] error:", error);
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

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const id = BigInt(postId);
  const post = await prisma.posts.findUnique({
    where: { id },
    select: { deleted_at: true },
  });

  if (!post) {
    return NextResponse.json({ message: "Məqalə tapılmadı" }, { status: 404 });
  }

  if (post.deleted_at) {
    return NextResponse.json({ message: "Məqalə artıq silinib" }, { status: 400 });
  }

  const now = new Date();
  const userId = session.user?.id ? Number(session.user.id) : null;

  const deletedPost = await prisma.posts.update({
    where: { id },
    data: {
      deleted_at: now,
      deleted_by: userId,
      updated_at: now,
    },
    select: {
      slug: true,
    },
  });

  // Cloudflare cache-i purge et
  await purgePostCache(postId, deletedPost.slug || null).catch((error) => {
    console.error("Failed to purge Cloudflare cache:", error);
  });

  return NextResponse.json({ message: "Məqalə silindi" });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { postId } = await params;
  const id = BigInt(postId);
  const now = new Date();

  if (body.action === "toggle-status") {
    const post = await prisma.posts.findUnique({
      where: { id },
      select: { status: true, deleted_at: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Məqalə tapılmadı" }, { status: 404 });
    }

    if (post.deleted_at) {
      return NextResponse.json({ message: "Silinmiş məqaləni redaktə edə bilməzsiniz" }, { status: 400 });
    }

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: {
        status: !post.status,
        updated_at: now,
      },
      select: {
        status: true,
        slug: true,
      },
    });

    // Cloudflare cache-i purge et
    await purgePostCache(postId, updatedPost.slug || null).catch((error) => {
      console.error("Failed to purge Cloudflare cache:", error);
    });

    return NextResponse.json({
      message: updatedPost.status ? "Məqalə aktivləşdirildi" : "Məqalə deaktivləşdirildi",
      status: updatedPost.status,
    });
  }

  if (body.action === "toggle-publish") {
    const post = await prisma.posts.findUnique({
      where: { id },
      select: { publish: true, deleted_at: true, slug: true, published_date: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Məqalə tapılmadı" }, { status: 404 });
    }

    if (post.deleted_at) {
      return NextResponse.json({ message: "Silinmiş məqaləni redaktə edə bilməzsiniz" }, { status: 400 });
    }

    const newPublish = post.publish === 1 ? 0 : 1;
    const updateData: any = {
      publish: newPublish,
      updated_at: now,
    };

    // Əgər yayımlanırsa və published_date yoxdursa, cari tarixi qoy
    if (newPublish === 1 && !post.published_date) {
      updateData.published_date = now;
    }
    // Əgər qaralama statusuna keçirilirsə, published_date-i silmə, saxla

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: updateData,
      select: {
        publish: true,
        slug: true,
      },
    });

    // Cloudflare cache-i purge et
    await purgePostCache(postId, updatedPost.slug || null).catch((error) => {
      console.error("Failed to purge Cloudflare cache:", error);
    });

    return NextResponse.json({
      message: updatedPost.publish === 1 ? "Məqalə yayımlandı" : "Məqalə qaralamaya çevrildi",
      publish: updatedPost.publish,
    });
  }

  if (body.action === "restore") {
    const post = await prisma.posts.findUnique({
      where: { id },
      select: { deleted_at: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Məqalə tapılmadı" }, { status: 404 });
    }

    if (!post.deleted_at) {
      return NextResponse.json({ message: "Məqalə artıq bərpa olunub" }, { status: 400 });
    }

    const restoredPost = await prisma.posts.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        updated_at: now,
      },
      select: {
        slug: true,
      },
    });

    // Cloudflare cache-i purge et
    await purgePostCache(postId, post.slug || null).catch((error) => {
      console.error("Failed to purge Cloudflare cache:", error);
    });

    return NextResponse.json({ message: "Məqalə bərpa edildi" });
  }

  return NextResponse.json({ message: "Naməlum əməliyyat" }, { status: 400 });
}

