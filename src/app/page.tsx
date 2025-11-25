import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";

export default async function Home() {
  try {
    const session = await getCurrentSession();
    if (session) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  } catch (error) {
    console.error("Home page error:", error);
    redirect("/login");
  }
}
