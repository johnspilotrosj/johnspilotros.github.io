import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toaster from './components/Toast.jsx';
import ClickSpark from './bits/ClickSpark.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Home />
      </main>
      <Footer />
      <Toaster />
      <ClickSpark />
    </>
  );
}
