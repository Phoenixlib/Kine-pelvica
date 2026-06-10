import { Navbar } from "~/components/Navbar";
import { Hero } from "~/components/Hero";
import { auth } from "~/server/auth";
import { About } from "~/components/About";
import { Services } from "~/components/Services";
import { BuzonComunidad } from "~/components/BuzonComunidad";
import { Reviews } from "~/components/Reviews";
import { Gallery } from "~/components/Gallery";
import { Blog } from "~/components/Blog";
import { Location } from "~/components/Location";
import { Footer } from "~/components/Footer";
import { db } from "~/server/db";

// Force dynamic rendering to ensure admin changes are immediately visible
export const dynamic = "force-dynamic";

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
        key: {
          in: [
            "about_title",
            "about_description",
            "about_image",
            "address",
            "whatsapp_number",
            "instagram_url",
            "facebook_url",
            "email_address",
          ],
        },
      },
    });

    return {
      title: configs.find((c) => c.key === "about_title")?.value,
      description: configs.find((c) => c.key === "about_description")?.value,
      imageUrl: configs.find((c) => c.key === "about_image")?.value,
      address: configs.find((c) => c.key === "address")?.value,
      whatsapp: configs.find((c) => c.key === "whatsapp_number")?.value,
      instagram: configs.find((c) => c.key === "instagram_url")?.value,
      facebook: configs.find((c) => c.key === "facebook_url")?.value,
      email: configs.find((c) => c.key === "email_address")?.value,
    };
  } catch (error) {
    console.error("Error fetching about configurations from Prisma:", error);
    return {};
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
    const data = await db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      take: 4,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        mainImage: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return data && data.length > 0
      ? data.map((post) => ({
          _id: post.id,
          title: post.title,
          slug: post.slug,
          image:
            post.mainImage ??
            "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          category: post.category?.name ?? "",
          description: post.description,
          publishedAt: post.publishedAt?.toISOString() ?? "",
        }))
      : null;
  } catch (error) {
    console.error("Error fetching blog posts from DB, using fallback:", error);
    return null;
  }
}

export default async function Home() {
  // Fetch data concurrently for optimal performance
  const [servicesData, aboutData, galleryData, postsData, session] =
    await Promise.all([
      getServicesFromDb(),
      getAboutConfig(),
      getGalleryFromDb(),
      getBlogPosts(),
      auth(),
    ]);

  const whatsappCleaned = aboutData.whatsapp
    ? aboutData.whatsapp.replace(/\D/g, "")
    : "56950840767";

  return (
    <>
      <Navbar isAdmin={!!session?.user} />

      <main className="min-h-screen font-body text-teal bg-offwhite selection:bg-terracotta selection:text-white scroll-smooth relative">
        {/* Section 1: Hero (bg-teal / Verde) */}
        <Hero />

        {/* Section 2: About (bg-cream / Café Claro) */}
        <About
          title={aboutData.title}
          description={aboutData.description}
          imageUrl={aboutData.imageUrl}
          whatsapp={aboutData.whatsapp}
          instagram={aboutData.instagram}
          facebook={aboutData.facebook}
          email={aboutData.email}
        />

        {/* Section 3: Services (bg-offwhite / Crema) */}
        <Services initialCategories={servicesData} />

        {/* Section 4: Reviews / Reseñas (bg-cream / Café Claro) */}
        <Reviews />

        {/* Section 5: Gallery / Antes y Después (bg-offwhite / Crema) */}
        <Gallery photos={galleryData} />

        {/* Section 6: Blog / Artículos (bg-teal / Verde) */}
        <Blog initialPosts={postsData} />

        {/* Section 7: Community Inbox Form (bg-teal / Verde) */}
        <BuzonComunidad />

        {/* Section 8: Location / Cómo llegar (bg-offwhite) */}
        <Location address={aboutData.address} />
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappCleaned}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:shadow-[#25D366]/50 transition-all z-50 animate-bounce-slow gap-2"
        aria-label="Contactar por WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </a>
    </>
  );
}
