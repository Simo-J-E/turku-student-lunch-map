import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/turku" element={<HomePage />} />
      <Route path="/restaurant/:slug" element={<RestaurantPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
