import Navbar from '../components/Navbar';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <Pricing showCta={false} />
      <FAQ />
      <Footer />
    </>
  );
}
