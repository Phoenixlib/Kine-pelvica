import { Navbar } from "~/components/Navbar";
import { Hero } from "~/components/Hero";
import { About } from "~/components/About";
import { Services } from "~/components/Services";
import { Testimonials } from "~/components/Testimonials";
import { Reviews } from "~/components/Reviews";
import { Gallery } from "~/components/Gallery";
import { Blog } from "~/components/Blog";
import { Footer } from "~/components/Footer";
import { sanityClient } from "~/lib/sanity";
import { db } from "~/server/db";

// Dynamic cache revalidation interval (10 minutes)
export const revalidate = 600;

async function getServicesFromDb() {
  try {
    const categories = await db.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    if (categories.length === 0) return null;

    return categories.map((cat) => ({
      name: cat.name,
      services: cat.services.map((srv) => ({
        name: srv.name,
        price: srv.price,
        duration: srv.duration,
        details: srv.description,
        bookingUrl: srv.calComBookingUrl,
      })),
    }));
  } catch (error) {
    console.error("Error fetching services from Prisma:", error);
    return null;
  }
}

async function getAboutConfig() {
  try {
    const configs = await db.siteConfig.findMany({
      where: {
        key: { in: ["about_title", "about_description", "about_image"] },
      },
    });

    return {
      title: configs.find((c) => c.key === "about_title")?.value,
      description: configs.find((c) => c.key === "about_description")?.value,
      imageUrl: configs.find((c) => c.key === "about_image")?.value,
    };
  } catch (error) {
    console.error("Error fetching about configurations from Prisma:", error);
    return {};
  }
}

async function getTestimonialsFromDb() {
  try {
    return await db.testimonial.findMany({
      where: { status: "READ" },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch (error) {
    console.error("Error fetching testimonials from Prisma:", error);
    return null;
  }
}

async function getGalleryFromDb() {
  try {
    return await db.galleryPhoto.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Error fetching gallery from Prisma:", error);
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
  // Fetch data sequentially to avoid Prisma connection pool exhaustion in dev
  const servicesData = await getServicesFromDb();
  const aboutData = await getAboutConfig();
  const testimonialsData = await getTestimonialsFromDb();
  const galleryData = await getGalleryFromDb();
  const postsData = await getBlogPosts();

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen font-body text-teal bg-offwhite selection:bg-terracotta selection:text-white scroll-smooth relative">
        {/* Section 1: Hero (bg-teal / Verde) */}
        <Hero />
        
        {/* Section 2: About (bg-cream / Café Claro) */}
        <About 
          title={aboutData.title}
          description={aboutData.description}
          imageUrl={aboutData.imageUrl}
        />
        
        {/* Section 3: Services (bg-offwhite / Crema) */}
        <Services initialCategories={servicesData} />

        {/* Section 4: Testimonials Carousel + Submit Form (bg-teal / Verde) */}
        <Testimonials initialTestimonials={testimonialsData} />
        
        {/* Section 5: Reviews / Reseñas (bg-cream / Café Claro) */}
        <Reviews />
        
        {/* Section 6: Gallery / Antes y Después (bg-offwhite / Crema) */}
        <Gallery photos={galleryData} />
        
        {/* Section 7: Blog / Artículos (bg-teal / Verde) */}
        <Blog initialPosts={postsData} />
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
