import { Navbar } from "~/components/Navbar";
import { Hero } from "~/components/Hero";
import { About } from "~/components/About";
import { Services } from "~/components/Services";
import { Gallery } from "~/components/Gallery";
import { Blog } from "~/components/Blog";
import { Reviews } from "~/components/Reviews";
import { TestimonialForm } from "~/components/TestimonialForm";
import { Footer } from "~/components/Footer";
import { sanityClient } from "~/lib/sanity";

async function getServices() {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
      return null;
    }
    const data = await sanityClient.fetch(`
      *[_type == "serviceCategory"] | order(order asc) {
        name,
        "services": *[_type == "service" && category._ref == ^._id] | order(order asc) {
          name,
          price,
          duration,
          details
        }
      }
    `);
    return data && data.length > 0 ? data : null;
  } catch (error) {
    console.error("Error fetching services from Sanity, using fallback:", error);
    return null;
  }
}

async function getBlogPosts() {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
      return null;
    }
    const data = await sanityClient.fetch(`
      *[_type == "post"] | order(publishedAt desc)[0...4] {
        _id,
        title,
        "slug": slug.current,
        "image": mainImage.asset->url,
        "category": category->title,
        description,
        publishedAt
      }
    `);
    return data && data.length > 0 ? data : null;
  } catch (error) {
    console.error("Error fetching blog posts from Sanity, using fallback:", error);
    return null;
  }
}

export default async function Home() {
  const servicesData = await getServices();
  const postsData = await getBlogPosts();

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen font-body text-teal bg-offwhite selection:bg-terracotta selection:text-white scroll-smooth relative">
        <Hero />
        <About />
        <Services initialCategories={servicesData} />
        <Gallery />
        <Blog initialPosts={postsData} />
        <Reviews />
        <TestimonialForm />
      </main>
      
      <Footer />

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/56950840767" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:shadow-[#25D366]/50 transition-all z-50 animate-bounce-slow gap-2"
        aria-label="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </a>
    </>
  );
}
