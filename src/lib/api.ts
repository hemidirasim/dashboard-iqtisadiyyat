import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Network xətası
    if (!error.response) {
      const message = error.message || "Şəbəkə xətası baş verdi";
      return Promise.reject(new Error(message));
    }

    // Server xətası
    const status = error.response.status;
    const data = error.response.data;

    let message = data?.message || error.message || "Xəta baş verdi";

    // Validation xətaları
    if (status === 400 && data?.issues) {
      const issues = data.issues;
      if (issues.fieldErrors) {
        const firstError = Object.values(issues.fieldErrors).flat()[0];
        if (firstError) {
          message = firstError as string;
        }
      } else if (issues.formErrors) {
        message = issues.formErrors[0] || message;
      }
    }

    // 401 Unauthorized
    if (status === 401) {
      message = "Giriş tələb olunur";
    }

    // 403 Forbidden
    if (status === 403) {
      message = data?.message || "Bu əməliyyat üçün icazə yoxdur";
    }

    // 404 Not Found
    if (status === 404) {
      message = data?.message || "Tapılmadı";
    }

    // 500 Server Error
    if (status === 500) {
      // Daha detallı xəta mesajı
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = typeof data.error === "string" ? data.error : "Server xətası baş verdi";
      } else {
        message = "Server xətası baş verdi";
      }
    }

    // Error obyektini yarat
    const errorWithResponse = new Error(message) as any;
    if (error.response) {
      errorWithResponse.response = error.response;
      errorWithResponse.status = status;
      errorWithResponse.data = data;
    }

    return Promise.reject(errorWithResponse);
  },
);

