import { LabProvider } from "@/components/LabContext";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Overview from "@/components/sections/Overview";
import Anatomy from "@/components/sections/Anatomy";
import Versions from "@/components/sections/Versions";
import Modes from "@/components/sections/Modes";
import ErrorCorrection from "@/components/sections/ErrorCorrection";
import Masks from "@/components/sections/Masks";
import Process from "@/components/sections/Process";
import Variants from "@/components/sections/Variants";
import Applications from "@/components/sections/Applications";
import Security from "@/components/sections/Security";
import Design from "@/components/sections/Design";
import Programming from "@/components/sections/Programming";
import Compare from "@/components/sections/Compare";
import Faq from "@/components/sections/Faq";
import Glossary from "@/components/sections/Glossary";
import Quiz from "@/components/sections/Quiz";

export default function Home() {
  return (
    <LabProvider>
      <Nav />
      <main>
        <Hero />
        <Overview />
        <Anatomy />
        <Versions />
        <Modes />
        <ErrorCorrection />
        <Masks />
        <Process />
        <Variants />
        <Applications />
        <Security />
        <Design />
        <Programming />
        <Compare />
        <Faq />
        <Glossary />
        <Quiz />
      </main>
      <Footer />
    </LabProvider>
  );
}
