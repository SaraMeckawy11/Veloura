import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import OrderFlow from './pages/OrderFlow';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<OrderFlow />} />
        <Route path="/order/success/:orderId" element={<OrderSuccess />} />
        <Route path="/order/failed/:orderId?" element={<OrderSuccess />} />
        <Route path="/dashboard/:editToken" element={<Dashboard />} />
        <Route path="/edit/:editToken" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
