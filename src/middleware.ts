import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/features(.*)",
  "/pricing(.*)",
  "/ielts-speaking(.*)",
  "/business(.*)",
  "/interview-coach(.*)",
  "/api/webhook(.*)",
  // AI endpoints (scripts, practice, coach, tts, …) are NOT listed here: they
  // spend OpenAI credit, so only signed-in users may call them.
  "/report(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
