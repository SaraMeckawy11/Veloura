import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
// Features bar temporarily hidden from the home screen.
// import FeaturesBar from '../components/FeaturesBar';
import Designs from '../components/Designs';
import HowItWorks from '../components/HowItWorks';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      {/* <FeaturesBar /> */}
      <Designs />
      <HowItWorks />
      <Pricing showCta={false} />
      <FAQ />
      <Contact />
      <Footer />
    </>
  );
}
