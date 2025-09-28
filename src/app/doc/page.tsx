import { redirect } from "next/navigation";

export default function LandingRedirect() {
  // Keep /landingPage working by redirecting to the new root landing page
  redirect("https://firebasestorage.googleapis.com/v0/b/university-club-platform.firebasestorage.app/o/Energy%20Week%20Booklet%20Design-April-15-2025-s_250924_164117.pdf?alt=media&token=fcfa14e8-e651-47cc-8556-b90535416fc2");
}