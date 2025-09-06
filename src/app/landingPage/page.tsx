import { redirect } from "next/navigation";

export default function LandingRedirect() {
  // Keep /landingPage working by redirecting to the new root landing page
  redirect("/");
}
