import { CtaBanner } from "@/components/layout/cta-banner";
import { Advantages } from "@/components/home/advantages";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { LatestBlog } from "@/components/home/latest-blog";
import { Pricing } from "@/components/home/pricing";
import { SocialProof } from "@/components/home/social-proof";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Advantages />
      <Pricing />
      <Testimonials />
      <Faq />
      <LatestBlog />
      <CtaBanner />
    </>
  );
}
