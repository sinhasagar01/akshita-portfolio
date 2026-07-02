import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import LoginForm from "@/components/studio/LoginForm";

// GH-6 — the /studio login page. It sits OUTSIDE the (dashboard) route group, so
// the owner gate does not apply here (no redirect loop). An already-authenticated
// owner is sent straight to the dashboard.
export default async function StudioLogin() {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (session) {
    redirect("/studio");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}
