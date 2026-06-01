import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DownloadPage from './pages/Download';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/download/:id" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  );
}
