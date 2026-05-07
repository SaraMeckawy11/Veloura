import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import OrderFlow from './pages/OrderFlow';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';
import Invitation from './pages/Invitation';
import MyInvitation from './pages/MyInvitation';
import PricingPage from './pages/PricingPage';
import LegalPage from './pages/LegalPage';

function DemoInvitation() {
  const { templateSlug } = useParams();
  return <Invitation demo templateSlug={templateSlug} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/refund-policy" element={<LegalPage type="refund" />} />
        <Route path="/order" element={<OrderFlow />} />
        <Route path="/order/success/:orderId" element={<OrderSuccess />} />
        <Route path="/order/failed/:orderId?" element={<OrderSuccess />} />
        <Route path="/dashboard/:editToken" element={<Dashboard />} />
        <Route path="/edit/:editToken" element={<Dashboard />} />
        <Route path="/my-invitation" element={<MyInvitation />} />
        <Route path="/demo/:templateSlug" element={<DemoInvitation />} />
        <Route path="/i/:publicSlug" element={<Invitation />} />
      </Routes>
    </BrowserRouter>
  );
}
