import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { az } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DATE_FORMAT = "dd MMM yyyy, HH:mm";

export function formatBigInt(value: bigint | null | undefined) {
  return typeof value === "bigint" ? Number(value) : value ?? 0;
}

/**
 * Format published_date - heç bir konvertasiya etmədən, tarixi olduğu kimi formatla
 * Input-dan nə gəlirsə, o da bazaya yazılır və bazadan nə gələrsə, o da elə oxunur
 */
export function formatPublishedDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    let dateObj: Date;
    if (typeof date === "string") {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    // Heç bir timezone çevirməsi etmədən, tarixi olduğu kimi formatla
    return format(dateObj, DATE_FORMAT, {
      locale: az,
    });
  } catch (error) {
    console.error("Published date formatting error:", error, date);
    return "-";
  }
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    // String isə, onu Date obyektinə çevir
    let dateObj: Date;
    if (typeof date === "string") {
      // ISO string formatını parse et
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Tarixin düzgün olub olmadığını yoxla
    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    // UTC tarixini Bakı vaxtına çevir (UTC+4)
    // Database-də UTC-də saxlanılan tarixi Bakı vaxtı formatında göstər
    return formatInTimeZone(dateObj, "Asia/Baku", DATE_FORMAT, {
      locale: az,
    });
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "-";
  }
}

