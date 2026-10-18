import type { ComponentType } from 'react'
import Navbar from '@/components/site/navbar'
import Hero from '@/components/site/hero'
import TrustBar from '@/components/site/trust-bar'
import Services from '@/components/site/services'
import WhatICanSolve from '@/components/site/what-i-can-solve'
import Projects from '@/components/site/projects'
import KaggleWork from '@/components/site/kaggle-work'
import DemoShowcase from '@/components/site/demo-showcase'
import CaseStudies from '@/components/site/case-studies'
import Experience from '@/components/site/experience'
import Skills from '@/components/site/skills'
import Certifications from '@/components/site/certifications'
import Platforms from '@/components/site/platforms'
import Testimonials from '@/components/site/testimonials'
import Pricing from '@/components/site/pricing'
import FAQ from '@/components/site/faq'
import Insights from '@/components/site/insights'
import AboutPreview from '@/components/site/about-preview'
import StartProject from '@/components/site/start-project'
import BookACall from '@/components/site/book-a-call'
import Contact from '@/components/site/contact'
import Footer from '@/components/site/footer'
import FloatingContact from '@/components/site/floating-contact'
import ScrollProgress from '@/components/site/scroll-progress'
import JsonLd from '@/components/site/json-ld'
import { HOME_SECTION_IDS, homeSections } from '@/config/profile'
import { resolveHomeSections } from '@/lib/home-sections'

const SECTIONS: Record<(typeof HOME_SECTION_IDS)[number], ComponentType> = {
  hero: Hero,
  trustBar: TrustBar,
  services: Services,
  solutions: WhatICanSolve,
  projects: Projects,
  kaggle: KaggleWork,
  demos: DemoShowcase,
  caseStudies: CaseStudies,
  experience: Experience,
  skills: Skills,
  certifications: Certifications,
  platforms: Platforms,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: FAQ,
  insights: Insights,
  about: AboutPreview,
  startProject: StartProject,
  bookCall: BookACall,
  contact: Contact,
}

export default function Home() {
  // Order + visibility are controlled from Admin → Content → "Homepage sections".
  const order = resolveHomeSections(homeSections, HOME_SECTION_IDS) as (keyof typeof SECTIONS)[]
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <JsonLd />
      <ScrollProgress />
      {/* Skip-to-content for keyboard & screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        {order.map((id) => {
          const Section = SECTIONS[id]
          return <Section key={id} />
        })}
      </main>
      <Footer />
      <FloatingContact />
    </div>
  )
}
