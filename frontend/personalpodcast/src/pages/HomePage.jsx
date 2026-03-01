import React from 'react'
import HeroSection from '../components/HomePageComps/HeroSection'
import AccordionSection from '../components/HomePageComps/AccordionSection'
import TopEpisodesSection from '../components/HomePageComps/TopEpisodesSection'

function HomePage() {
  return (
    <div>
      <HeroSection />
      <TopEpisodesSection />
      <AccordionSection />
    </div>
  )
}

export default HomePage
