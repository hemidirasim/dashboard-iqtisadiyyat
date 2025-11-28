/**
 * Cloudflare Cache Purge Helper
 */

const CLOUDFLARE_ACCOUNT_ID = "e6845c429e647d998855becabe7dd141";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "21ePGcdR_G_zu2Vj8AH7i2MY7svyquBAxwWM9gv4";
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "95b91a0199d301dba984f8057a3b35bf";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://iqtisadiyyat.az";

/**
 * Get zone ID for a domain
 */
async function getZoneId(domain: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    
    if (data.success && data.result && data.result.length > 0) {
      return data.result[0].id;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting Cloudflare zone ID:", error);
    return null;
  }
}

/**
 * Purge cache by URLs
 */
async function purgeCacheByUrls(urls: string[]): Promise<boolean> {
  try {
    // Get zone ID if not provided
    let zoneId = CLOUDFLARE_ZONE_ID;
    
    if (!zoneId) {
      const domain = new URL(BASE_URL).hostname;
      zoneId = await getZoneId(domain);
      
      if (!zoneId) {
        console.error("Cloudflare zone ID not found");
        return false;
      }
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: urls,
        }),
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ Cloudflare cache purged successfully:", urls);
      return true;
    } else {
      console.error("❌ Cloudflare cache purge failed:", data.errors);
      return false;
    }
  } catch (error) {
    console.error("Error purging Cloudflare cache:", error);
    return false;
  }
}

/**
 * Purge everything (purge all cache)
 */
async function purgeAllCache(): Promise<boolean> {
  try {
    let zoneId = CLOUDFLARE_ZONE_ID;
    
    if (!zoneId) {
      const domain = new URL(BASE_URL).hostname;
      zoneId = await getZoneId(domain);
      
      if (!zoneId) {
        console.error("❌ Cloudflare zone ID not found");
        return false;
      }
    }

    console.log(`🔄 Purging all Cloudflare cache for zone: ${zoneId}`);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purge_everything: true,
        }),
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ Cloudflare cache purged successfully (everything)");
      return true;
    } else {
      console.error("❌ Cloudflare cache purge failed:", data.errors || data);
      return false;
    }
  } catch (error: any) {
    console.error("❌ Error purging Cloudflare cache:", error?.message || error);
    return false;
  }
}

/**
 * Purge cache for a post
 * This will purge:
 * - The post page
 * - The home page
 * - Category pages (if needed)
 */
export async function purgePostCache(postId?: string, slug?: string | null) {
  // Lokal development zamanı cache purge etmə (yalnız production-da)
  if (process.env.NODE_ENV === "development" || BASE_URL.includes("localhost")) {
    console.log("⚠️  Skipping cache purge in development mode");
    return;
  }

  const urls: string[] = [];
  
  // Base URLs to purge
  urls.push(`${BASE_URL}/az/`);
  urls.push(`${BASE_URL}/`);
  
  // Post page URL
  if (postId && slug) {
    urls.push(`${BASE_URL}/az/post/${slug}-${postId}`);
  }
  
  // Purge cache (non-blocking)
  purgeCacheByUrls(urls).catch((error) => {
    console.error("Failed to purge cache:", error);
  });
}

/**
 * Purge all cache (for major changes)
 */
export async function purgeAllCloudflareCache() {
  // Lokal development zamanı cache purge etmə (yalnız production-da)
  if (process.env.NODE_ENV === "development" || BASE_URL.includes("localhost")) {
    console.log("⚠️  Skipping cache purge in development mode");
    return;
  }

  purgeAllCache().catch((error) => {
    console.error("Failed to purge all cache:", error);
  });
}

