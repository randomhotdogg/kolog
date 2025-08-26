import NavigationMenu from "@/components/navigation-menu"
import { LandingHero } from "@/components/landing-hero"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <NavigationMenu className="absolute top-0 z-50 bg-white/80 backdrop-blur-sm" />
      <LandingHero />
      <Footer />
    </div>
  )
}
