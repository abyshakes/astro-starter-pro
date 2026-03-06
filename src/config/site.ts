import ogImage from "../assets/og-image.png";

export const siteConfig = {
  name: "abyshakes",
  description:
    "Full-stack web consultant with 24 years of experience. Sitting at the intersection of brand thinking and engineering.",
  url: "https://www.abyshakes.com",
  lang: "en",
  locale: "en_US",
  author: "Abhishek Prabhu",
  twitter: "@abyshakes",
  ogImage: ogImage,
  socialLinks: {
    twitter: "https://x.com/abyshakes",
    github: "https://github.com/abyshakes",
    linkedin: "https://www.linkedin.com/in/abhishekprabhu/",
  },
  navLinks: [
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
    { text: "Services", href: "/services" },
    { text: "Blog", href: "/blog" },
    { text: "Contact", href: "/contact" },
  ],
};
