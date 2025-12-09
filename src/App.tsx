import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Category from './pages/Category';
import Search from './pages/Search';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Categories from './pages/Categories';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-panelGray">
      <Navbar />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:name" element={<Category />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
