import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Activities from "@/pages/Activities";
import Rankings from "@/pages/Rankings";
import GameArena from "@/pages/GameArena";
import Shop from "@/pages/Shop";
import Intro from "@/pages/Intro";
import Partners from "@/pages/Partners";
import UserCenter from "@/pages/UserCenter";

function App() {
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/games" element={<GameArena />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/intro" element={<Intro />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/user" element={<UserCenter />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </QueryClientProvider>
    </div>
  );
}

export default App;
