import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import DashboardGallery from '../components/DashboardGallery'
import Features from '../components/Features'
import Architecture from '../components/Architecture'
import Pipeline from '../components/Pipeline'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <DashboardGallery />
      <Features />
      <Architecture />
      <Pipeline />
      <CTA />
    </>
  )
}
