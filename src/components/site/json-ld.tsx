import { credentials, profile, seo, services, faqs, insights, social } from '@/config/profile'

/**
 * Schema.org structured data:
 * - Person (verified CV info + SameAs profile links + contact points + credentials)
 * - WebSite
 * - ProfessionalService + Service catalog
 * - FAQPage
 * - BlogPosting graph (insights articles)
 * Rendered as inline JSON-LD script tags. Per-page BreadcrumbList JSON-LD is
 * emitted by PageShell (one breadcrumb per dedicated page).
 */
export default function JsonLd() {
  const siteUrl = profile.siteUrl

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.brandMessage,
    url: siteUrl,
    image: `${siteUrl}${profile.photo}`,
    email: profile.email,
    telephone: profile.phoneRaw,
    address: {
      '@type': 'PostalAddress',
      streetAddress: profile.address,
      addressLocality: 'Dhaka',
      addressCountry: 'BD',
    },
    sameAs: [
      social.linkedin,
      social.kaggle,
      social.github,
      social.upwork,
      social.freelancer,
      social.telegram,
    ].filter(Boolean),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: profile.phoneRaw,
        email: profile.email,
        availableLanguage: ['en', 'bn'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'telegram',
        telephone: profile.phoneRaw,
        availableLanguage: ['en', 'bn'],
      },
    ],
    knowsAbout: [
      'Data Science',
      'Machine Learning',
      'Deep Learning',
      'Data Analytics',
      'Predictive Analytics',
      'Power BI',
      'Python',
      'SQL',
      'TensorFlow',
      'Keras',
      'Retrieval-Augmented Generation',
      'AI Automation',
      'Big Data',
      'PRINCE2 Project Management',
    ],
    hasCredential: credentials.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      credentialCategory: c.category,
      recognizedBy: { '@type': 'Organization', name: c.provider },
    })),
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seo.siteName,
    url: siteUrl,
    inLanguage: 'en',
    author: { '@type': 'Person', name: profile.name },
    publisher: { '@type': 'Person', name: profile.name },
  }

  const professionalService = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: profile.name,
    description: seo.description,
    url: siteUrl,
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Data & AI Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.tagline,
          serviceType: s.shortTitle,
          ...(s.priceFrom
            ? {
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'USD',
                  price: s.priceFrom,
                  priceSpecification: {
                    '@type': 'PriceSpecification',
                    minPrice: s.priceFrom,
                    priceCurrency: 'USD',
                    description: `Starting from $${s.priceFrom} — final quotation depends on scope`,
                  },
                },
              }
            : {}),
        },
      })),
    },
    sameAs: [social.linkedin, social.upwork, social.freelancer, social.kaggle, social.github].filter(Boolean),
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  /** BlogPosting graph for the insights articles (deep-linked via #article-<slug>). */
  const articlesGraph = {
    '@context': 'https://schema.org',
    '@graph': insights.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.excerpt,
      articleSection: a.category,
      keywords: a.tags.join(', '),
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: 'en',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#article-${a.slug}`,
      },
      author: {
        '@type': 'Person',
        name: profile.name,
        url: siteUrl,
      },
      publisher: {
        '@type': 'Person',
        name: profile.name,
        url: siteUrl,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articlesGraph) }}
      />
    </>
  )
}
