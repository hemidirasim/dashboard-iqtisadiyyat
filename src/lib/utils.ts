import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import { az } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DATE_FORMAT = "dd MMM yyyy, HH:mm";

export function formatBigInt(value: bigint | null | undefined) {
  return typeof value === "bigint" ? Number(value) : value ?? 0;
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

    // UTC tarixini UTC kimi göstər (timezone çevirmə etmə)
    // formatInTimeZone funksiyası ilə UTC timezone-da formatlayırıq
    return formatInTimeZone(dateObj, "UTC", DATE_FORMAT, {
      locale: az,
    });
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "-";
  }
}

