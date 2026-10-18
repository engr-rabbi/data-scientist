/**
 * ============================================================================
 * CENTRALIZED PROFILE & CONTENT CONFIGURATION
 * Shah Muhammad Fazle Rabbi — Data Scientist | ML Engineer | AI & Analytics
 * ----------------------------------------------------------------------------
 * EDIT THIS FILE to update name, contact info, links, services, projects,
 * skills, experience, certifications, FAQs and pricing — without touching
 * any component.
 *
 * ⚠️ CONTENT POLICY: Do not fabricate clients, testimonials, results, metrics
 * or credentials. Where real information is missing, a clearly marked
 * placeholder is used. Placeholders below are marked with `TODO(...)`.
 * ============================================================================
 */

import contentOverrides from '@/content/overrides.json'
import { applyContentOverrides } from '@/lib/content-overrides'

/* ---------------------------------- Types --------------------------------- */

export type IconName =
  | 'bar-chart'
  | 'brain'
  | 'trending-up'
  | 'bot'
  | 'workflow'
  | 'scan'
  | 'globe'

export interface Service {
  id: string
  number: string
  icon: IconName
  /** Optional picture shown on the service card (upload in Admin → Media, then choose it here). */
  image?: string
  imageAlt?: string
  imageCaption?: string
  /** Optional custom link for the CTA button (default: opens the inquiry form pre-filled with this service). */
  ctaLink?: string
  /** false = hidden on the website (Admin: Inactive). Default: shown. */
  published?: boolean
  featured?: boolean
  title: string
  shortTitle: string
  tagline: string
  items: string[]
  ctaLabel: string
  priceFrom: number | null
  detail: {
    problem: string
    solution: string
    process: string[]
    deliverables: string[]
    technologies: string[]
  }
}

export interface Project {
  id: string
  /** Short description shown on the card (falls back to `problem`). */
  summary?: string
  /** Detailed description shown in the project dialog. */
  description?: string
  /** Results / metrics (one per line). */
  results?: string[]
  caseStudyUrl?: string
  visualAlt?: string
  visualCaption?: string
  /** Additional images (gallery in the dialog). */
  images?: string[]
  /** false = real / client project (hides the "Demo dataset" labels). Default: demo. */
  isDemo?: boolean
  published?: boolean
  featured?: boolean
  title: string
  category: 'Analytics' | 'Machine Learning' | 'Deep Learning' | 'AI' | 'Automation' | 'Research'
  problem: string
  solution: string
  tech: string[]
  highlights: string[]
  dataset: string
  github?: string
  demo?: string
  /** Honest one-line role statement (e.g. solo end-to-end build). */
  role?: string
  /** Optional illustrative technical visual (custom-rendered, not a client screenshot). */
  visual?: string
}

export interface CaseStudy {
  id: string
  /** URL-friendly slug for the dedicated, individually indexable case-study page. */
  slug: string
  title: string
  category: string
  /** Optional illustrative technical visual (custom-rendered, not a client screenshot). */
  visual?: string
  summary: string
  challenge: string
  data: string
  dataQuality: string[]
  approach: string[]
  technology: string[]
  results: { value: string; label: string; note: string }[]
  businessMeaning: string
  limitations: string
  nextStep: string
}

export interface Solution {
  problem: string
  solution: string
  serviceRef: string
}

/* --------------------------------- Profile -------------------------------- */

export const profile = {
  name: 'Shah Muhammad Fazle Rabbi',
  // Short version used ONLY where UI space requires it.
  shortName: 'S. M. Fazle Rabbi',
  initials: 'SMFR',
  title: 'Data Scientist | Machine Learning Engineer | AI & Data Analytics Specialist',
  secondaryPositioning: 'Python • SQL • Machine Learning • Deep Learning • Data Analytics • Power BI • AI Automation',
  tagline: 'Turning Data into Decisions, Predictions & AI Solutions',
  heroParagraph:
    'I combine data analytics, machine learning, deep learning, and AI automation to transform complex data and business problems into practical, measurable solutions.',
  valueProposition:
    'I help organizations and businesses transform raw data into meaningful insights, predictive models, interactive dashboards, and practical AI-powered solutions.',
  brandMessage: 'I turn data into insights, predictions, and practical AI solutions.',
  finalCta: "Have a data or AI problem? Let's build the solution.",
  location: 'Dhaka, Bangladesh · Working remotely worldwide',
  // Real contact details (verified CV, SMFR.pdf).
  address: '6/1, 2 No. Road, Dokkhingaon Bazar, Sobujbag, Basabo, Dhaka-1214',
  email: 'tusher.ce@gmail.com',
  phoneDisplay: '+880 1550-155170',
  phoneRaw: '+8801550155170', // used for tel: link
  whatsapp: '8801550155170', // country code, no +
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  // Real profile photo (aspect ratio preserved 759×876, gentle sharpening only).
  photo: '/profile-photo.jpg',
}

export const social = {
  linkedin: 'https://www.linkedin.com/in/sm-fazle-rabbi/',
  kaggle: 'https://www.kaggle.com/engineerrabbi', // verified CV
  upwork: 'https://www.upwork.com/freelancers/~01cb2a35abb2a992e5?viewMode=1',
  freelancer: 'https://www.freelancer.com/u/smfazlerabbi',
  github: 'https://github.com/engr-rabbi', // verified CV (portfolio)
  telegram: 'https://t.me/+8801550155170', // owner-provided number, same as WhatsApp
  company: 'https://www.teletalk.com.bd', // verified CV (employer)
}

/* --------------------- Verified public-source activity --------------------- */

export interface KaggleActivity {
  /**
   * Category. "Dataset analysis" is the legacy label (still valid in saved admin data);
   * it is displayed as "Dataset".
   */
  kind: 'Competition' | 'Notebook' | 'Dataset' | 'Dataset analysis'
  title: string
  year: number
  /** Short description — shown on the card. */
  description: string
  /** Detailed description — shown in the "View Details" dialog (falls back to `description`). */
  detail?: string
  /** Related skills. */
  skills: string[]
  /** Technologies used (card chips fall back to `skills` when empty). */
  tech?: string[]
  /** Thumbnail / cover image (a built-in placeholder is shown when empty or unavailable). */
  image?: string
  imageAlt?: string
  /** Link to this item on kaggle.com — only add a URL you have verified. */
  kaggleUrl?: string
  /** Competition result / ranking — ONLY if verified. Never guessed. */
  result?: string
  /** Link to the user's own public repo mirroring the work (verified). */
  repoUrl: string
  repoName: string
  featured?: boolean
  published?: boolean
}

/**
 * Kaggle & data-science activities verified through the owner's own public
 * GitHub repositories (github.com/engr-rabbi). NO ranks, medals, tiers or
 * competition results are claimed — participation and public code only.
 */
export const kaggleActivities: KaggleActivity[] = [
  {
    kind: 'Competition',
    title: 'Predict Calorie Expenditure',
    year: 2025,
    description:
      'Kaggle Playground Series 2025 entry: regression of calories burned during a workout from exercise and body metrics.',
    skills: ['Python', 'Regression', 'Feature Engineering'],
    repoUrl: 'https://github.com/engr-rabbi/Predict-Calorie-Expenditure',
    repoName: 'Predict-Calorie-Expenditure',
  },
  {
    kind: 'Competition',
    title: 'Regression of Used Car Prices',
    year: 2024,
    description:
      'Kaggle competition: predict used-car prices from make, model, mileage, year and engine features — a supervised regression problem.',
    skills: ['Python', 'XGBoost', 'Regression'],
    repoUrl: 'https://github.com/engr-rabbi/Regression-of-Used-Car-Prices_Kaggle',
    repoName: 'Regression-of-Used-Car-Prices_Kaggle',
  },
  {
    kind: 'Competition',
    title: 'House Prices: Advanced Regression Techniques',
    year: 2024,
    description:
      'Kaggle classic: Ames, Iowa sale-price prediction — feature engineering, missing-data handling and model tuning.',
    skills: ['Python', 'Feature Engineering', 'Model Tuning'],
    repoUrl: 'https://github.com/engr-rabbi/house-prices-advanced-regression-techniques',
    repoName: 'house-prices-advanced-regression-techniques',
  },
  {
    kind: 'Competition',
    title: 'Titanic — Machine Learning from Disaster',
    year: 2024,
    description:
      'Kaggle starter competition: passenger survival prediction with cleaning, EDA, feature engineering and model evaluation.',
    skills: ['Python', 'Classification', 'EDA'],
    repoUrl: 'https://github.com/engr-rabbi/Titanic---Machine-Learning-from-Disaster',
    repoName: 'Titanic---Machine-Learning-from-Disaster',
  },
  {
    kind: 'Notebook',
    title: 'Power Transformations for Model Performance',
    year: 2023,
    description:
      'Open notebook on optimizing accuracy with power transformations — normalizing distributions and reducing skew.',
    skills: ['Python', 'Statistics', 'scikit-learn'],
    repoUrl: 'https://github.com/engr-rabbi/Data_Science_Power_Transformations',
    repoName: 'Data_Science_Power_Transformations',
  },
  {
    kind: 'Notebook',
    title: 'scikit-learn Pipeline Deep Dive',
    year: 2023,
    description:
      'Reusable sklearn Pipelines: preprocessing, feature selection and model training assembled into one cross-validatable object.',
    skills: ['scikit-learn', 'Cross-validation', 'Best Practices'],
    repoUrl: 'https://github.com/engr-rabbi/SklearnPipeline',
    repoName: 'SklearnPipeline',
  },
  {
    kind: 'Notebook',
    title: 'Imputation Strategy Benchmarks',
    year: 2023,
    description:
      'Mean vs median imputation strategies compared for data integrity and downstream model performance.',
    skills: ['Python', 'Data Cleaning', 'Pandas'],
    repoUrl: 'https://github.com/engr-rabbi/Mean_Median_Imputation_Strategies',
    repoName: 'Mean_Median_Imputation_Strategies',
  },
  {
    kind: 'Dataset',
    title: 'Mental Health, Lifestyle & Stress',
    year: 2024,
    description:
      'EDA of academic/work pressure, financial stress and lifestyle habits against well-being outcomes.',
    skills: ['EDA', 'Visualization', 'Pandas'],
    repoUrl: 'https://github.com/engr-rabbi/Mental-Health-Lifestyle-and-Stress',
    repoName: 'Mental-Health-Lifestyle-and-Stress',
  },
]

export interface NotableRepo {
  name: string
  url: string
  description: string
  language: string
  tag: 'Data Science' | 'Machine Learning' | 'AI' | 'Engineering' | 'Community'
}

/** Highlighted public GitHub repositories (verified public source: api.github.com). */
export const notableRepos: NotableRepo[] = [
  {
    name: 'ml-handbook',
    url: 'https://github.com/engr-rabbi/ml-handbook',
    description:
      'Complete ML handbook: preprocessing, statistics, supervised/unsupervised learning, deep learning, NLP, CV, evaluation and MLOps workflows.',
    language: 'HTML / Python',
    tag: 'Machine Learning',
  },
  {
    name: 'complete-python-course',
    url: 'https://github.com/engr-rabbi/complete-python-course',
    description:
      'Free self-paced Python course — 20 interactive modules with in-browser execution, quizzes and real projects.',
    language: 'HTML',
    tag: 'Community',
  },
  {
    name: 'krishiBazar-AI',
    url: 'https://github.com/engr-rabbi/krishiBazar-AI',
    description:
      'AI platform concept empowering Bangladeshi farmers with fair prices and a transparent supply chain.',
    language: 'TypeScript',
    tag: 'AI',
  },
  {
    name: 'Applied-Data-Science-Capstone',
    url: 'https://github.com/engr-rabbi/Applied-Data-Science-Capstone',
    description:
      'IBM Data Science capstone work — the closing project of the professional certificate program.',
    language: 'Jupyter Notebook',
    tag: 'Data Science',
  },
]

/* ------------------------------- Navigation ------------------------------- */

export const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
]

// Full menu used in the mobile sheet & footer quick links
export const allNavLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Case Studies', href: '#case-studies' },
  { label: 'Insights', href: '#insights' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Kaggle', href: '#platforms' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Book a Call', href: '#book-a-call' },
  { label: 'Contact', href: '#contact' },
]

/* ------------------------- Dedicated site pages ---------------------------- */

/**
 * Every major homepage section also has its own dedicated, individually
 * indexable page. This is the single source of truth for navigation menus,
 * the footer, breadcrumbs, related-page links and the XML sitemap.
 */
export interface SitePage {
  label: string
  href: string
  /** SEO <title> for the dedicated page. */
  title: string
  /** Unique meta description for the dedicated page. */
  description: string
  /** Short summary used in nav dropdowns / related-page cards. */
  blurb: string
  /** Optional shorter label for tight navigation spaces. */
  navLabel?: string
}

export const sitePages: SitePage[] = [
  {
    label: 'About',
    href: '/about',
    title: 'About — Data Scientist, ML Engineer & AI Specialist (Achievements & Expertise)',
    description:
      'Professional achievements and expertise showcase: practical data science & machine learning work, data analytics and BI delivery, deep learning, verified certifications, training and Kaggle competitions — what I have done, learned and can build for you.',
    blurb: 'Achievements, expertise, Kaggle work and credentials.',
  },
  {
    label: 'Services',
    href: '/services',
    title: 'Data Science & AI Services — Analytics, ML, Deep Learning & Automation',
    description:
      'Engagements offered: data analytics & Power BI dashboards, machine learning & predictive analytics, deep learning, AI automation & RAG assistants — each with a clear process and deliverables.',
    blurb: 'Analytics, ML, deep learning and AI automation engagements.',
  },
  {
    label: 'Projects',
    href: '/projects',
    title: 'Data Science & Machine Learning Projects — Portfolio',
    description:
      'Hands-on portfolio of analytics, machine learning, deep learning and AI projects — Python, SQL, TensorFlow, Power BI and RAG, with problem → solution → result for every build.',
    blurb: 'Problem → solution → result for every build.',
  },
  {
    label: 'Case Studies',
    href: '/case-studies',
    title: 'Case Studies — Business Problems Solved with Data & AI',
    description:
      'Step-by-step case studies: how messy data becomes a predictive model, a dashboard, or an AI assistant — with context, approach, results and lessons learned.',
    blurb: 'Context, approach and results, step by step.',
  },
  {
    label: 'Skills',
    href: '/skills',
    title: 'Skills & Toolbox — Python, SQL, TensorFlow, Power BI & AI',
    description:
      'The toolbox behind the work: Python, SQL, Pandas, scikit-learn, TensorFlow & Keras, Power BI, RAG/LLM automation and PRINCE2 project management.',
    blurb: 'The toolbox behind every engagement.',
  },
  {
    label: 'Experience',
    href: '/experience',
    title: 'Experience — From Civil Engineering to Data Science & AI',
    description:
      'Professional experience across telecom engineering (Teletalk Bangladesh), international engineering delivery in the UAE, and independent data science, ML & AI practice.',
    blurb: 'Telecom, international engineering and independent practice.',
  },
  {
    label: 'Certifications & Training',
    href: '/certifications',
    navLabel: 'Certifications',
    title: 'Certifications & Training — IBM Data Science, PRINCE2®, Big Data',
    description:
      'Verified certifications and professional training: IBM Data Science (Coursera), Machine Learning A-Z™ (Udemy), PRINCE2® Foundation & Practitioner, Big Data & FusionInsight HD (Hangzhou, China) and more.',
    blurb: 'Verified credentials, categorized and explained.',
  },
  {
    label: 'Kaggle & Profiles',
    href: '/kaggle',
    navLabel: 'Kaggle',
    title: 'Kaggle Competitions & Data Science Portfolio — Verified Public Work',
    description:
      'Verified Kaggle competition participation and open notebooks — Titanic, House Prices, Used Car Price regression, Calorie Expenditure (Playground 2025) — plus GitHub data science repos, LinkedIn and freelance profiles.',
    blurb: 'Verified Kaggle work, GitHub repos and profiles.',
  },
  {
    label: 'Testimonials',
    href: '/testimonials',
    title: 'Testimonials — What Clients & Colleagues Say',
    description:
      'Feedback from clients and collaborators on analytics, machine learning and AI automation work — plus how I collect it honestly.',
    blurb: 'Honest feedback from real collaborations.',
  },
  {
    label: 'Contact',
    href: '/contact',
    title: 'Contact — WhatsApp, Phone & Email (Dhaka, Bangladesh)',
    description:
      'Reach Shah Muhammad Fazle Rabbi directly: WhatsApp, phone, email or the contact form. Based in Dhaka (GMT+6), working with clients worldwide.',
    blurb: 'WhatsApp, phone, email and the contact form.',
  },
  {
    label: 'Start a Project',
    href: '/start-a-project',
    title: 'Start a Project — Tell Me About Your Data or AI Problem',
    description:
      'Send your project brief: data analytics, machine learning, forecasting, dashboards, RAG assistant or AI automation. Attach files, get a scoped reply within 24 hours.',
    blurb: 'Project inquiry form with file upload.',
  },
  {
    label: 'Book a Call',
    href: '/book-a-call',
    title: 'Book a Call — Free 30-Minute Data Science Discovery Call',
    description:
      'Reserve a free 30-minute discovery call in your own timezone. Pick a slot, propose a time and manage your booking — no account needed.',
    blurb: 'Free 30-minute discovery call, dual timezone.',
  },
]

/* -------------------------------- Trust bar ------------------------------- */

export const trustBar = [
  'Data Science',
  'Machine Learning',
  'Deep Learning',
  'Data Analytics',
  'AI Automation',
  'Python & SQL',
  'Power BI',
  'Engineering & Project Management',
]

/* ---------------------------------- About --------------------------------- */

export const about = {
  narrative: [
    'I am Shah Muhammad Fazle Rabbi — a data scientist and machine learning engineer with a real-world engineering foundation. My path runs from engineering and industry operations, through project management, into data science, machine learning and applied AI.',
    'I solve business problems end to end: starting from messy raw data, through cleaning and exploratory analysis, to predictive models, interactive dashboards, and AI-powered automations that people actually use in their daily work.',
    'Having worked inside engineering organizations and managed projects, I understand how technical work fits into business realities — budgets, deadlines, communication and documentation. That is how I work: clear requirements, reproducible analysis, honest evaluation, and solutions designed for deployment.',
  ],
  snapshot: [
    { label: 'Industry', value: 'Telecommunication · Data Science' },
    { label: 'Foundation', value: 'Engineering background' },
    { label: 'International', value: 'Engineering experience in the UAE' },
    { label: 'Focus', value: 'Data → Analytics → Prediction → AI → Automation' },
    { label: 'Public work', value: '33 public repositories · 4 Kaggle competitions' },
  ],
  howIWork: [
    {
      title: 'Understand the problem first',
      body: 'Every engagement starts with the business question — not the technology. What decision will this analysis or model improve?',
    },
    {
      title: 'Build reproducibly',
      body: 'Clean code, documented notebooks, version control and clear reporting, so results can be verified and maintained.',
    },
    {
      title: 'Communicate clearly',
      body: 'Findings are explained in plain business language, with visualizations that support decisions — not impress analysts.',
    },
    {
      title: 'Design for deployment',
      body: 'Models and dashboards are built with the operational reality in mind: data pipelines, refresh cycles and handover.',
    },
  ],
}

/* --------------------------------- Services ------------------------------- */

export const services: Service[] = [
  {
    id: 'data-analytics-bi',
    number: '01',
    icon: 'bar-chart',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'Data Analytics & Business Intelligence',
    shortTitle: 'Data Analytics & BI',
    tagline: 'From raw spreadsheets to clear, decision-ready dashboards and reports.',
    items: [
      'Data Cleaning',
      'Exploratory Data Analysis',
      'Statistical Analysis',
      'KPI Analysis',
      'Business Reporting',
      'Python Data Analysis',
      'SQL Analysis',
      'Power BI Dashboards',
      'Data Visualization',
    ],
    ctaLabel: 'Analyze My Data',
    priceFrom: 150, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'Your data is scattered across spreadsheets, exports and systems. Nobody trusts the numbers, reports take days to assemble, and leadership makes decisions on incomplete information.',
      solution:
        'I consolidate and clean your data, run structured exploratory and statistical analysis, and turn it into Power BI dashboards or automated reports that answer your actual business questions — with KPIs everyone agrees on.',
      process: [
        'Requirement — define the business questions and KPIs',
        'Data / Input — collect and profile sources (Excel, CSV, SQL, exports)',
        'Cleaning / Preparation — fix missing values, duplicates, schemas',
        'Analysis / Modeling — EDA, statistics, aggregations',
        'Validation — verify numbers against known business facts',
        'Delivery — dashboard / report + documentation and handover',
      ],
      deliverables: [
        'Clean, documented dataset',
        'EDA report with key findings',
        'Interactive Power BI dashboard',
        'KPI definitions and data dictionary',
        'Reproducible Python/SQL analysis code',
      ],
      technologies: ['Python', 'Pandas', 'SQL', 'Power BI', 'Excel', 'Matplotlib', 'Seaborn'],
    },
  },
  {
    id: 'ml-predictive',
    number: '02',
    icon: 'brain',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'Machine Learning & Predictive Analytics',
    shortTitle: 'ML & Predictive Analytics',
    tagline: 'Predict churn, risk, demand and behavior with models you can actually explain.',
    items: [
      'Regression',
      'Classification',
      'Clustering',
      'Predictive Modeling',
      'Customer Churn',
      'Risk Prediction',
      'Customer Segmentation',
      'Feature Engineering',
      'Model Evaluation',
      'Explainable AI',
    ],
    ctaLabel: 'Build a Predictive Model',
    priceFrom: 250, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'You are always reacting — to churn, to risk, to changing customer behavior — because the signals were buried in your data and nobody could extract them in time.',
      solution:
        'I build supervised and unsupervised models tailored to your problem: churn prediction, risk scoring, segmentation. Every model comes with honest evaluation, explainability (feature importance, SHAP-style analysis) and clear guidance on how to act on predictions.',
      process: [
        'Requirement — define the prediction target and business value',
        'Data / Input — assemble historical, labeled data',
        'Cleaning / Preparation — feature engineering, encoding, scaling',
        'Analysis / Modeling — train and compare candidate models',
        'Validation — cross-validation, holdout testing, error analysis',
        'Delivery — model, evaluation report, scoring guide or API',
      ],
      deliverables: [
        'Trained, serialized model',
        'Evaluation report (metrics, confusion matrix, error analysis)',
        'Feature importance / explainability analysis',
        'Scoring notebook or simple API',
        'Recommendations for production deployment',
      ],
      technologies: ['Python', 'Scikit-learn', 'XGBoost', 'Pandas', 'NumPy', 'SHAP'],
    },
  },
  {
    id: 'forecasting',
    number: '03',
    icon: 'trending-up',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'Time Series & Forecasting',
    shortTitle: 'Time Series & Forecasting',
    tagline: 'Sales, demand and revenue forecasts you can plan operations around.',
    items: [
      'Sales Forecasting',
      'Demand Forecasting',
      'Revenue Forecasting',
      'Time Series Analysis',
      'Trend Analysis',
      'Forecast Evaluation',
    ],
    ctaLabel: 'Request a Forecasting Solution',
    priceFrom: 200, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'You plan inventory, staffing or budgets on gut feeling and last quarter’s spreadsheet — and pay for it in stockouts, overstock or missed targets.',
      solution:
        'I analyze your historical series for trend, seasonality and external drivers, build and back-test forecasting models, and deliver forecasts with confidence intervals and clear accuracy reporting — so planning becomes a data-driven conversation.',
      process: [
        'Requirement — define the forecast horizon and granularity',
        'Data / Input — historical series, calendar and driver data',
        'Cleaning / Preparation — gaps, outliers, seasonality decomposition',
        'Analysis / Modeling — baseline → statistical → ML models',
        'Validation — back-testing with rolling windows, accuracy metrics',
        'Delivery — forecast outputs, monitoring and refresh process',
      ],
      deliverables: [
        'Forecast model with back-test results',
        'Forecast outputs (values + confidence intervals)',
        'Accuracy report (MAE / MAPE / RMSE)',
        'Refresh notebook or automated script',
      ],
      technologies: ['Python', 'Statsmodels', 'Prophet-style models', 'Scikit-learn', 'Pandas'],
    },
  },
  {
    id: 'ai-llm-rag',
    number: '04',
    icon: 'bot',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'AI / LLM / RAG Solutions',
    shortTitle: 'AI / LLM / RAG',
    tagline: 'AI assistants that actually know your documents and business context.',
    items: [
      'RAG Applications',
      'Document Q&A',
      'AI Knowledge Assistants',
      'LLM API Integration',
      'Semantic Search',
      'Embeddings',
      'Vector Search',
      'AI Document Analysis',
    ],
    ctaLabel: 'Build an AI Solution',
    priceFrom: 300, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'Your team wastes hours searching through hundreds of PDFs, reports, contracts and manuals — and the knowledge leaves with every employee who does.',
      solution:
        'I build Retrieval-Augmented Generation (RAG) applications: your documents are indexed into embeddings and a vector store, so an AI assistant answers questions with grounded, cited extracts from your own material — not generic guesses.',
      process: [
        'Requirement — define use cases, users and document landscape',
        'Data / Input — collect and parse documents (PDF, DOCX, scans)',
        'Cleaning / Preparation — chunking, embeddings, vector indexing',
        'Analysis / Modeling — retrieval pipeline + LLM orchestration',
        'Validation — answer quality review, grounding and citation checks',
        'Delivery — assistant (app/UI), evaluation set and documentation',
      ],
      deliverables: [
        'Working RAG application or assistant',
        'Document ingestion & indexing pipeline',
        'Evaluation examples and quality notes',
        'Deployment and usage documentation',
      ],
      technologies: ['Python', 'LLM APIs', 'LangChain-style frameworks', 'Embeddings', 'Vector DBs', 'Next.js'],
    },
  },
  {
    id: 'ai-automation',
    number: '05',
    icon: 'workflow',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'AI Automation & Workflow Integration',
    shortTitle: 'AI Automation',
    tagline: 'Automate repetitive workflows and let AI handle the boring parts.',
    items: [
      'AI Workflow Automation',
      'n8n Automation',
      'AI Assistants',
      'Business Process Automation',
      'Email Automation',
      'Data Processing Automation',
      'Google Sheets / Gmail / CRM integrations',
      'AI-powered workflows',
    ],
    ctaLabel: 'Automate My Workflow',
    priceFrom: 150, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'Your team copies data between tools, sends the same emails, compiles the same reports — hours of skilled time spent on repetitive work every week.',
      solution:
        'I map your repetitive workflows and automate them: data processing scripts, integrations between your tools (Sheets, Gmail, CRM), n8n-style workflow automation and AI steps (classification, summarization, drafting) exactly where they add value.',
      process: [
        'Requirement — map the current workflow and pain points',
        'Data / Input — identify systems, formats and triggers',
        'Cleaning / Preparation — define data flow and error handling',
        'Analysis / Modeling — build automation and AI steps',
        'Validation — run parallel with current process, verify outputs',
        'Delivery — automation + monitoring + documentation',
      ],
      deliverables: [
        'Working automated workflow',
        'Integration between your tools',
        'Error handling and monitoring notes',
        'Documentation and team handover',
      ],
      technologies: ['Python', 'n8n', 'APIs', 'Google Sheets', 'Gmail', 'Webhooks', 'LLM APIs'],
    },
  },
  {
    id: 'deep-learning-cv',
    number: '06',
    icon: 'scan',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'Deep Learning & Computer Vision',
    shortTitle: 'Deep Learning & CV',
    tagline: 'Neural networks for images, text and documents — trained and evaluated properly.',
    items: [
      'Neural Networks',
      'CNN',
      'Image Classification',
      'Object Detection',
      'Computer Vision',
      'OCR',
      'NLP',
      'Transfer Learning',
    ],
    ctaLabel: 'Discuss an AI/ML Project',
    priceFrom: 300, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'You have image, text or document workloads — classifying photos, extracting text from scans, understanding document content — that are too varied for rules and too voluminous for humans.',
      solution:
        'I design and train deep learning solutions using CNNs and transfer learning for vision tasks, OCR pipelines for document digitization, and NLP techniques for text — with honest evaluation on held-out data and clear guidance on production constraints.',
      process: [
        'Requirement — define task, classes/outputs and success criteria',
        'Data / Input — assemble and label image/text data',
        'Cleaning / Preparation — augmentation, normalization, splits',
        'Analysis / Modeling — architecture selection and training',
        'Validation — held-out evaluation, error analysis',
        'Delivery — model + inference script + documentation',
      ],
      deliverables: [
        'Trained model with evaluation report',
        'Inference / prediction script',
        'Error analysis and known limitations',
        'Deployment recommendations',
      ],
      technologies: ['Python', 'TensorFlow', 'Keras', 'PyTorch', 'OpenCV', 'Tesseract / OCR'],
    },
  },
  {
    id: 'web-research',
    number: '07',
    icon: 'globe',
    image: '', // optional picture — set it in Admin → Content → Services
    title: 'Web Research & Data Extraction',
    shortTitle: 'Web Research & Data',
    tagline: 'Structured datasets from public web sources — collected legally and cleanly.',
    items: [
      'Web Research',
      'Public Data Collection',
      'Data Extraction',
      'Competitor Research',
      'Market Research',
      'Product Research',
      'Data Cleaning',
      'Dataset Preparation',
    ],
    ctaLabel: 'Start a Research Project',
    priceFrom: 100, // TODO: indicative starting price — edit here
    detail: {
      problem:
        'You need market, competitor or product data that exists only on public websites — and manually collecting it into a usable dataset would take your team weeks.',
      solution:
        'I collect and structure publicly available data (respecting terms of service and technical/legal boundaries), clean it, and deliver analysis-ready datasets with documentation — plus a summary of what the data actually says.',
      process: [
        'Requirement — define target data, sources and update needs',
        'Data / Input — identify permitted public sources',
        'Cleaning / Preparation — extraction, parsing, deduplication',
        'Analysis / Modeling — validation and structuring',
        'Validation — spot-check accuracy against source',
        'Delivery — dataset (CSV/XLSX/DB) + documentation + summary',
      ],
      deliverables: [
        'Clean structured dataset',
        'Source and methodology documentation',
        'Data dictionary',
        'Summary of key observations',
      ],
      technologies: ['Python', 'Requests', 'BeautifulSoup', 'Pandas', 'SQL', 'Excel'],
    },
  },
]

/* ----------------------------- What I Can Solve --------------------------- */

export const solutions: Solution[] = [
  { problem: 'I have messy data.', solution: 'Data Cleaning + EDA', serviceRef: 'data-analytics-bi' },
  { problem: 'I need a dashboard.', solution: 'Power BI + KPI Reporting', serviceRef: 'data-analytics-bi' },
  { problem: 'I want to predict future sales.', solution: 'Forecasting + ML', serviceRef: 'forecasting' },
  { problem: 'I want to know which customers may leave.', solution: 'Churn Prediction', serviceRef: 'ml-predictive' },
  { problem: 'I have thousands of documents.', solution: 'RAG / AI Knowledge Assistant', serviceRef: 'ai-llm-rag' },
  { problem: 'My repetitive process takes hours.', solution: 'AI Automation', serviceRef: 'ai-automation' },
  { problem: 'I need information from many websites.', solution: 'Research + Data Extraction', serviceRef: 'web-research' },
]

/* ---------------------------- Before / After flow ------------------------- */

export const transformationFlow = [
  { step: 'Raw Data', note: 'Messy exports, missing values' },
  { step: 'Clean Data', note: 'Validated, structured, documented' },
  { step: 'Analysis', note: 'EDA, statistics, patterns' },
  { step: 'Dashboard', note: 'Live KPIs for decisions' },
  { step: 'Prediction', note: 'ML models on fresh data' },
  { step: 'Business Decision', note: 'Confident, data-backed action' },
]

/* --------------------------------- Projects ------------------------------- */
// NOTE: Portfolio entries below are demonstration cases built on public or
// clearly synthetic datasets. Replace / extend with verified client projects
// and real metrics as they become available. Never present demo metrics as
// client results.

export const projectCategories = ['All', 'Analytics', 'Machine Learning', 'Deep Learning', 'AI', 'Automation', 'Research'] as const

export const projects: Project[] = [
  {
    id: 'sales-analytics-dashboard',
    title: 'Sales Analytics Dashboard',
    category: 'Analytics',
    problem: 'Sales leadership had no single view of revenue, product and regional performance — reporting was manual and inconsistent.',
    solution: 'An interactive Power BI dashboard with drill-through pages for regions, products and time intelligence, plus documented data model.',
    role: 'Solo build — data model, DAX measures, dashboard design and handover documentation.',
    visual: '/images/projects/powerbi-sales-dashboard.jpg',
    tech: ['Power BI', 'DAX', 'Excel'],
    highlights: ['Star-schema data model', 'Drill-through & bookmark navigation', 'Monthly refresh workflow'],
    dataset: 'Demo: synthetic retail sales dataset',
    github: '',
    demo: '',
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics Report',
    category: 'Analytics',
    problem: 'A service business lacked clarity on customer activity patterns and retention-relevant segments.',
    solution: 'Python EDA pipeline plus a segmented customer view with cohort-style activity analysis.',
    tech: ['Python', 'Pandas', 'Seaborn'],
    highlights: ['Automated EDA notebook', 'Segment activity charts', 'Findings summary for non-technical readers'],
    dataset: 'Demo: synthetic customer transactions',
    github: '',
    demo: '',
  },
  {
    id: 'executive-kpi-dashboard',
    title: 'Executive KPI Dashboard',
    category: 'Analytics',
    problem: 'Executives needed a one-screen, always-current view of core KPIs instead of a 40-page monthly deck.',
    solution: 'A single-page executive dashboard with KPI cards, trend sparklines and variance-to-target visuals.',
    tech: ['Power BI', 'SQL'],
    highlights: ['KPI card layout', 'Target vs actual variance', 'Mobile-friendly layout mode'],
    dataset: 'Demo: synthetic company KPIs',
    github: '',
    demo: '',
  },
  {
    id: 'operational-analytics',
    title: 'Operational Analytics (Telecom-style)',
    category: 'Analytics',
    problem: 'Field operations data lived in separate logs; incident and performance trends were invisible to management.',
    solution: 'SQL-based consolidation with trend and SLA-style reporting, visualized for weekly operations review.',
    tech: ['SQL', 'Python', 'Power BI'],
    highlights: ['Incident trend analysis', 'SLA-style performance view', 'Weekly automated summary'],
    dataset: 'Demo: synthetic operations logs',
    github: '',
    demo: '',
  },
  {
    id: 'churn-prediction',
    title: 'Customer Churn Prediction',
    category: 'Machine Learning',
    problem: 'A subscription-style business wanted to know which customers are likely to leave — before they do.',
    solution: 'End-to-end churn model: EDA, feature engineering, gradient-boosted classifiers, explainability and a scoring notebook.',
    role: 'Solo build — EDA, feature engineering, modeling, evaluation and explainability.',
    visual: '/images/projects/churn-model-analysis.jpg',
    tech: ['Python', 'Scikit-learn', 'XGBoost', 'SHAP'],
    highlights: ['EDA → features → model → evaluation pipeline', 'Model comparison with cross-validation', 'Feature importance / explainability report'],
    dataset: 'Demo: public IBM Telco Customer Churn dataset',
    github: '',
    demo: '',
  },
  {
    id: 'sales-forecasting',
    title: 'Sales Forecasting',
    category: 'Machine Learning',
    problem: 'Monthly sales planning relied on naive extrapolation with no account for trend or seasonality.',
    solution: 'Time-series pipeline with seasonality decomposition, baseline vs ML model comparison and back-tested accuracy.',
    role: 'Solo build — decomposition, back-testing and forecast delivery with intervals.',
    visual: '/images/projects/sales-forecast-chart.jpg',
    tech: ['Python', 'Statsmodels', 'Scikit-learn'],
    highlights: ['Seasonality & trend decomposition', 'Back-testing with rolling windows', 'Forecast with confidence intervals'],
    dataset: 'Demo: synthetic retail sales series',
    github: '',
    demo: '',
  },
  {
    id: 'demand-forecasting',
    title: 'Demand Forecasting (SKU-level)',
    category: 'Machine Learning',
    problem: 'Inventory decisions were made reactively, causing stockouts of fast movers and overstock of slow movers.',
    solution: 'Per-category demand forecasting with calendar features and hierarchical review of forecast accuracy.',
    tech: ['Python', 'Pandas', 'Scikit-learn'],
    highlights: ['Calendar & holiday features', 'Category-level accuracy report', 'Planning-ready output tables'],
    dataset: 'Demo: synthetic multi-SKU demand data',
    github: '',
    demo: '',
  },
  {
    id: 'customer-segmentation',
    title: 'Customer Segmentation',
    category: 'Machine Learning',
    problem: 'Marketing treated all customers identically because there was no data-driven segmentation.',
    solution: 'Clustering pipeline (K-Means with feature scaling and cluster validation) producing interpretable customer personas.',
    tech: ['Python', 'Scikit-learn', 'K-Means'],
    highlights: ['Cluster count selection (elbow/silhouette)', 'Persona interpretation charts', 'Marketing action suggestions per segment'],
    dataset: 'Demo: public Mall Customers dataset',
    github: '',
    demo: '',
  },
  {
    id: 'document-rag-assistant',
    title: 'PDF / Document RAG Assistant',
    category: 'AI',
    problem: 'A document-heavy team spent hours searching PDFs and manuals for answers they needed daily.',
    solution: 'RAG assistant: document ingestion, chunking, embeddings, vector search and cited answers over a private document set.',
    role: 'Solo build — ingestion pipeline, embeddings, retrieval strategy and answer generation.',
    visual: 'diagram:rag',
    tech: ['Python', 'LLM APIs', 'Embeddings', 'Vector DB'],
    highlights: ['Cited, grounded answers', 'Simple ingestion pipeline for new docs', 'Evaluation examples included'],
    dataset: 'Demo: sample public PDF documents',
    github: '',
    demo: '',
  },
  {
    id: 'ai-workflow-automation',
    title: 'AI Workflow Automation',
    category: 'Automation',
    problem: 'A team manually classified and summarized incoming emails and moved data between tools every day.',
    solution: 'n8n-style automated workflow: inbox trigger, AI classification & summarization, structured logging to Sheets.',
    role: 'Solo build — workflow design, AI integration and handover documentation.',
    visual: 'diagram:workflow',
    tech: ['n8n', 'Python', 'LLM APIs', 'Google Sheets'],
    highlights: ['Trigger → AI → storage flow', 'Human-review step for edge cases', 'Setup documentation for handover'],
    dataset: 'Demo: sample notification/emails data',
    github: '',
    demo: '',
  },
  {
    id: 'image-classification',
    title: 'Image Classification (Transfer Learning)',
    category: 'Deep Learning',
    problem: 'Manual visual sorting of images was slow and error-prone, with categories a rules engine could not handle.',
    solution: 'CNN transfer-learning classifier with augmentation, held-out evaluation and an inference script.',
    role: 'Solo build — transfer learning, augmentation pipeline and error analysis.',
    visual: '/images/projects/cnn-image-classification.jpg',
    tech: ['Python', 'TensorFlow', 'Keras'],
    highlights: ['Transfer learning backbone', 'Augmentation pipeline', 'Confusion-matrix error analysis'],
    dataset: 'Demo: public sample image dataset',
    github: '',
    demo: '',
  },
  {
    id: 'ocr-document-extraction',
    title: 'OCR Document Extraction',
    category: 'Deep Learning',
    problem: 'Scanned forms and invoices required retyping before any analysis could happen.',
    solution: 'OCR pipeline converting scans to structured fields, with validation rules and export to spreadsheet.',
    tech: ['Python', 'Tesseract', 'OpenCV', 'Pandas'],
    highlights: ['Image pre-processing for OCR accuracy', 'Field-level extraction rules', 'Validated export to XLSX'],
    dataset: 'Demo: public sample scanned documents',
    github: '',
    demo: '',
  },
  {
    id: 'market-research-dataset',
    title: 'Market Research Dataset',
    category: 'Research',
    problem: 'A market entry analysis needed structured data on products and pricing that existed only across public web sources.',
    solution: 'Legally-collected, cleaned and structured dataset with source documentation and a summary analysis.',
    tech: ['Python', 'BeautifulSoup', 'Pandas'],
    highlights: ['Source & methodology notes', 'Deduplicated, validated records', 'Summary of key observations'],
    dataset: 'Demo: small public sample extraction',
    github: '',
    demo: '',
  },
  {
    id: 'competitor-intelligence',
    title: 'Competitor Intelligence Snapshot',
    category: 'Research',
    problem: 'Management had no systematic view of competitor offerings and public positioning.',
    solution: 'Structured research snapshot: competitor matrix, public offering data and periodically refreshable collection script.',
    tech: ['Python', 'Excel', 'Web research'],
    highlights: ['Competitor comparison matrix', 'Repeatable collection methodology', 'Executive-ready summary'],
    dataset: 'Demo: publicly available listings (sample)',
    github: '',
    demo: '',
  },
]

/* ------------------------------- Case studies ----------------------------- */

export const caseStudies: CaseStudy[] = [
  {
    id: 'cs-churn',
    slug: 'customer-churn-prediction-machine-learning',
    title: 'Customer Churn Prediction',
    category: 'Machine Learning',
    visual: '/images/projects/churn-model-analysis.jpg',
    summary:
      'A demonstration end-to-end churn system: from raw customer records to an explainable model that flags who is likely to leave and why.',
    challenge:
      'The business (demonstrated on the public IBM Telco Customer Churn dataset) had no forward-looking view of attrition. Retention offers were sent reactively — after the customer had already decided to leave.',
    data:
      'Public IBM Telco Customer Churn dataset: ~7,000 customer records with demographics, account details, subscribed services and a churn label.',
    dataQuality: [
      'Missing values concentrated in a single field (TotalCharges) for brand-new customers',
      'Categorical features with many levels requiring consistent encoding',
      'Class imbalance: churners are the minority class',
      'No true duplicates, but senior-citizen flag stored as numeric 0/1 requiring interpretation',
    ],
    approach: [
      'Exploratory analysis of churn rates across contract type, tenure and services',
      'Feature engineering: tenure bands, service-count, charge-per-month ratios',
      'Model comparison: logistic regression baseline vs tree-based ensembles',
      'Class-imbalance handling and threshold tuning around business cost of false positives',
      'Explainability: feature importance and per-customer driver analysis',
    ],
    technology: ['Python', 'Pandas', 'Scikit-learn', 'XGBoost', 'SHAP'],
    results: [
      { value: 'EDA', label: 'Contract type & tenure identified as dominant churn drivers', note: 'Demo finding on public dataset' },
      { value: 'CV', label: 'Cross-validated model comparison with holdout evaluation', note: 'Metrics available in the project notebook' },
      { value: 'Top-N', label: 'Ranked risk list suitable for targeted retention offers', note: 'Output format ready for CRM import' },
    ],
    businessMeaning:
      'Instead of blanket retention discounts, the team can contact a ranked list of at-risk customers and address their specific reasons — concentrating budget where it changes outcomes.',
    limitations:
      'Demonstration on a public telecom dataset. Real deployments need current customer data, verified labels and monitoring for data drift before any accuracy claim is made.',
    nextStep:
      'Deploy as a scheduled scoring job feeding a CRM list, with monthly re-training and drift checks.',
  },
  {
    id: 'cs-forecasting',
    slug: 'sales-forecasting-time-series-python',
    title: 'Sales Forecasting',
    category: 'Time Series',
    visual: '/images/projects/sales-forecast-chart.jpg',
    summary:
      'A demonstration forecasting pipeline that turns a raw monthly sales history into back-tested forecasts with confidence intervals.',
    challenge:
      'Planning (demonstrated on a synthetic retail sales series) was based on naive extrapolation. Seasonal spikes and trend shifts repeatedly surprised inventory and staffing plans.',
    data:
      'Synthetic monthly retail sales series with trend, yearly seasonality, promotion spikes and noise — clearly labeled as synthetic.',
    dataQuality: [
      'Promotion periods injected as spikes — must not be learned as organic demand',
      'One simulated data gap requiring interpolation policy decisions',
      'Short history limiting very long-horizon forecasts',
    ],
    approach: [
      'Decomposition of trend and seasonality to understand the signal',
      'Baselines first: naive and seasonal-naive references',
      'Statistical models compared against ML-style feature models',
      'Rolling-window back-testing for honest accuracy measurement',
      'Forecast outputs with prediction intervals, not single numbers',
    ],
    technology: ['Python', 'Statsmodels', 'Pandas', 'Scikit-learn'],
    results: [
      { value: 'Baseline→Model', label: 'Seasonal-naive baseline beaten consistently in back-tests', note: 'Demo pipeline on synthetic data' },
      { value: 'Intervals', label: 'Prediction intervals communicated alongside point forecasts', note: 'Planning uses ranges, not false precision' },
      { value: 'Refresh', label: 'Reproducible refresh notebook for monthly updates', note: 'Designed for handover' },
    ],
    businessMeaning:
      'Demand planning moves from guessing to ranges: inventory and staffing decisions can be stress-tested against optimistic and pessimistic scenarios.',
    limitations:
      'Synthetic data demonstrates method, not market reality. Real forecasts require at least 2 full seasonal cycles of clean history.',
    nextStep:
      'Connect to actual sales data with automated monthly refresh and accuracy monitoring dashboards.',
  },
]

/* ---------------------------------- Skills -------------------------------- */

export const skillGroups = [
  {
    title: 'Programming & Data',
    skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Statistics', 'EDA'],
  },
  {
    title: 'Visualization & BI',
    skills: ['Power BI', 'Matplotlib', 'Seaborn', 'Data Storytelling', 'KPI Reporting'],
  },
  {
    title: 'Machine Learning',
    skills: ['Scikit-learn', 'Regression', 'Classification', 'Clustering', 'XGBoost', 'Predictive Modeling', 'Feature Engineering'],
  },
  {
    title: 'Deep Learning',
    skills: ['TensorFlow', 'Keras', 'Neural Networks', 'CNN', 'NLP', 'Computer Vision'],
  },
  {
    title: 'AI & Automation',
    skills: ['LLM', 'RAG', 'Embeddings', 'AI APIs', 'n8n', 'Workflow Automation'],
  },
  {
    title: 'Engineering & Delivery',
    skills: ['Git', 'GitHub', 'APIs', 'Deployment', 'PRINCE2 Project Management', 'Documentation'],
  },
]

/* -------------------------------- Experience ------------------------------ */

export const experience = [
  {
    role: 'Engineering & Project Roles', // TODO: replace with exact latest confirmed job title
    org: 'Teletalk Bangladesh Limited',
    period: 'Current',
    points: [
      'Telecom engineering operations and technical reporting',
      'Infrastructure and project coordination with cross-functional teams',
      'Data-driven monitoring of operational performance',
    ],
  },
  {
    role: 'Engineering Roles',
    org: 'United Arab Emirates',
    period: 'Earlier career',
    points: [
      'On-site engineering delivery in an international environment',
      'Documentation, quality and safety-aware execution',
      'Cross-cultural team coordination',
    ],
  },
  {
    role: 'Data Science, ML & AI — Independent Practice',
    org: 'Freelance / Consulting',
    period: 'Ongoing',
    points: [
      'Applied ML & analytics projects (see Projects and Kaggle)',
      'Structured training: IBM Data Science, Machine Learning A-Z, Big Data (FusionInsight HD)',
      'PRINCE2-trained project delivery discipline',
    ],
  },
]

/* ------------------------------ Certifications ---------------------------- */

/**
 * Certifications & professional training — sourced ONLY from the verified CV
 * (SMFR.pdf). Content policy: no credential IDs, years, awards or rankings are
 * invented; `credentialId` / `verifyUrl` stay optional and are omitted unless
 * a verified source provides them.
 */
export type CredentialCategory =
  | 'Data Science'
  | 'Machine Learning'
  | 'Deep Learning'
  | 'Big Data'
  | 'Project Management'
  | 'Professional Development'

export interface Credential {
  id: string
  name: string
  provider: string
  location?: string
  kind: 'Certification' | 'Professional Training'
  category: CredentialCategory
  description: string
  skills: string[]
  credentialId?: string
  verifyUrl?: string
}

export const credentials: Credential[] = [
  {
    id: 'ibm-data-science',
    name: 'IBM Data Science',
    provider: 'Coursera',
    kind: 'Certification',
    category: 'Data Science',
    description:
      'Professional certification program in data science — the foundation for the Python, SQL and applied machine learning work across the Projects section.',
    skills: ['Python', 'SQL', 'Data Science', 'Machine Learning'],
  },
  {
    id: 'ml-az-udemy',
    name: 'Machine Learning A-Z™: AI, Python & R',
    provider: 'Udemy',
    kind: 'Certification',
    category: 'Machine Learning',
    description:
      'End-to-end machine learning training covering model building and evaluation in both Python and R, including the ChatGPT-augmented edition.',
    skills: ['Machine Learning', 'Python', 'R', 'Model Evaluation'],
  },
  {
    id: 'prince2',
    name: 'PRINCE2® Foundation & Practitioner',
    provider: 'ECADEME, Bangladesh',
    kind: 'Certification',
    category: 'Project Management',
    description:
      'Dual-level project management certification — the delivery discipline behind clear scoping, planning and stakeholder communication on every engagement.',
    skills: ['Project Management', 'Planning & Delivery', 'Risk & Quality Control', 'Stakeholder Communication'],
  },
  {
    id: 'bigdata-fusioninsight',
    name: 'Big Data & FusionInsight HD Technology Training',
    provider: 'Huawei',
    location: 'Hangzhou, China',
    kind: 'Professional Training',
    category: 'Big Data',
    description:
      'International training on big data platforms and FusionInsight HD — distributed storage and processing concepts behind large-scale analytics.',
    skills: ['Big Data', 'FusionInsight HD', 'Distributed Data Processing', 'Hadoop Ecosystem'],
  },
  {
    id: 'bim-etiquette',
    name: 'Etiquette, Manner & Protocol for Government Officials',
    provider: 'Bangladesh Institute of Management (BIM)',
    location: 'Dhaka',
    kind: 'Professional Training',
    category: 'Professional Development',
    description:
      'Formal training in professional etiquette, protocol and communication — useful daily when working with officials, stakeholders and cross-functional teams.',
    skills: ['Professional Communication', 'Protocol & Etiquette', 'Stakeholder Interaction'],
  },
]

/**
 * Professional memberships as listed on the verified CV. Providers are not
 * claimed beyond what the CV states.
 */
export const memberships = [
  {
    name: 'Python for Data Science, AI & Development',
    level: 'Member',
  },
  {
    name: 'IBM Data Science',
    level: 'Fellow Member',
  },
]

/* --------------------------------- Platforms ------------------------------ */

export const platforms = [
  {
    name: 'LinkedIn',
    description: 'Professional career, network and updates.',
    url: social.linkedin,
    cta: 'Connect on LinkedIn',
  },
  {
    name: 'Upwork',
    description: 'Freelance Data Science, ML and AI projects.',
    url: social.upwork,
    cta: 'Hire Me on Upwork',
  },
  {
    name: 'Freelancer',
    description: 'Freelance Data Science / ML projects.',
    url: social.freelancer,
    cta: 'Hire Me on Freelancer',
  },
  {
    name: 'Kaggle',
    description: 'Data science notebooks, datasets and experiments.',
    url: social.kaggle,
    cta: 'View Kaggle Profile',
  },
]

/* ------------------------------- Testimonials ----------------------------- */

export let testimonialsPlaceholder =
  'Client testimonials will be added as completed project feedback becomes available.'

/* --------------------------------- Pricing -------------------------------- */

export interface PricingModel {
  id: string
  name: string
  tagline: string
  icon: 'package' | 'clock' | 'repeat'
  bestFor: string
  priceNote: string
  priceSub: string
  inclusions: string[]
  popular?: boolean
  /** Service pre-selected in the start-project form (prefill-service contract). */
  serviceHint: string
  /** Budget range pre-selected in the start-project form (prefill-budget contract). */
  budgetHint: string
  ctaLabel: string
}

export const pricingModels: PricingModel[] = [
  {
    id: 'fixed-scope',
    name: 'Fixed-Scope Project',
    tagline: 'One clear deliverable, one agreed price.',
    icon: 'package',
    bestFor: 'Dashboards, analyses, forecasts or models with a defined outcome.',
    priceNote: 'From $100',
    priceSub: 'Agreed upfront — no hourly meter running.',
    inclusions: [
      'Scoping call and a written scope of work',
      'Fixed price and timeline before start',
      'Documented, reproducible code & files',
      'Handover walkthrough + 2 revision rounds',
    ],
    popular: true,
    serviceHint: 'data-analytics-bi',
    budgetHint: '$100 – $300',
    ctaLabel: 'Start a fixed-scope project',
  },
  {
    id: 'hourly',
    name: 'Hourly / Task-Based',
    tagline: 'Flexible help when the queue is unpredictable.',
    icon: 'clock',
    bestFor: 'Smaller tasks, quick analyses, debugging or extra hands on an existing pipeline.',
    priceNote: 'Billed per hour',
    priceSub: 'Only for time actually worked — pause anytime.',
    inclusions: [
      'Small tasks shipped fast, in priority order',
      'Short progress updates after each session',
      'Clean code + brief summary notes',
      'Scale up or down week to week',
    ],
    serviceHint: 'web-research',
    budgetHint: 'Under $100',
    ctaLabel: 'Book hourly help',
  },
  {
    id: 'retainer',
    name: 'Monthly Retainer',
    tagline: 'An on-demand data partner, not a one-off vendor.',
    icon: 'repeat',
    bestFor: 'Ongoing reporting, dashboard upkeep and models that are monitored & improved.',
    priceNote: 'Custom monthly quote',
    priceSub: 'Reserved hours each month, priority response.',
    inclusions: [
      'Dedicated hours reserved for your work',
      'Dashboard & report maintenance/refresh',
      'Continuous model monitoring & improvement',
      'Monthly summary report of what changed',
    ],
    serviceHint: 'data-analytics-bi',
    budgetHint: '$1,000 – $5,000',
    ctaLabel: 'Discuss a retainer',
  },
]

export const priceFactors = [
  {
    title: 'Data readiness',
    body: 'Clean, consolidated data is quicker to work with than scattered or messy sources.',
  },
  {
    title: 'Scope & complexity',
    body: 'The number of features, models, data sources or integrations involved.',
  },
  {
    title: 'Timeline',
    body: 'Standard delivery is more economical than urgent, compressed schedules.',
  },
  {
    title: 'Ongoing support',
    body: 'Refresh cycles, monitoring or maintenance after the initial delivery.',
  },
]

export let pricingNote =
  'All prices are indicative starting points. Every project receives a fixed quote after a short scoping call — no surprises, no hidden fees.'

/* ------------------------- Instant estimate (pricing) --------------------- */

export interface EstimateOption {
  /** Service id — feeds the prefill-service contract (start-project form). */
  serviceId: string
  /** Short chip label shown in the estimator. */
  label: string
  /** Honest ballpark — each value MUST exist in budgetRanges so the prefill applies. */
  range: string
  /** Typical delivery window for a standard (non-rush) engagement. */
  turnaround: string
  /** One-line scope summary shown in the estimate result. */
  scope: string
}

export const estimateOptions: EstimateOption[] = [
  {
    serviceId: 'data-analytics-bi',
    label: 'Analysis / Dashboard',
    range: '$100 – $300',
    turnaround: '3–7 days',
    scope: 'Data cleaning, charts and KPIs — or a full Power BI / Looker Studio dashboard.',
  },
  {
    serviceId: 'web-research',
    label: 'Research / Quick task',
    range: 'Under $100',
    turnaround: '1–3 days',
    scope: 'Web research, tidy scraped datasets, spreadsheet fixes and small scripts.',
  },
  {
    serviceId: 'ml-predictive',
    label: 'ML model',
    range: '$300 – $1,000',
    turnaround: '1–3 weeks',
    scope: 'Churn, risk or scoring models — trained, evaluated and explained in plain language.',
  },
  {
    serviceId: 'forecasting',
    label: 'Forecasting',
    range: '$300 – $1,000',
    turnaround: '1–2 weeks',
    scope: 'Sales or demand forecasts with seasonality, confidence ranges and a written method.',
  },
  {
    serviceId: 'ai-automation',
    label: 'AI automation',
    range: '$300 – $1,000',
    turnaround: '1–2 weeks',
    scope: 'Document, email or report workflows automated on top of LLM APIs.',
  },
  {
    serviceId: 'ai-llm-rag',
    label: 'AI assistant (RAG)',
    range: '$1,000 – $5,000',
    turnaround: '2–4 weeks',
    scope: 'A chat-with-your-docs assistant grounded in your own content and evaluated for accuracy.',
  },
  {
    serviceId: 'deep-learning-cv',
    label: 'Computer vision',
    range: '$1,000 – $5,000',
    turnaround: '2–4 weeks',
    scope: 'Image classification, OCR extraction or detection pipelines with a proper test set.',
  },
]

/** Shown when the visitor picks "Fast-track" — honest, no invented numbers. */
export let estimateRushNote =
  'Fast-track: I reshuffle my schedule to start within days — a rush premium is reflected in your fixed quote, not in a hidden fee.'

export let estimateDisclaimer =
  'Ballparks, not quotes. You get a fixed price and timeline after a short scoping call — the estimate only helps you frame the conversation.'

/* ----------------------------------- FAQ ---------------------------------- */

/** FAQ categories used by the filter chips in the FAQ section. */
export const faqCategories = [
  'Services & Capabilities',
  'Working Together',
  'Communication & Legal',
] as const

export type FaqCategory = (typeof faqCategories)[number]

export interface Faq {
  q: string
  a: string
  category: FaqCategory
}

export const faqs: Faq[] = [
  {
    q: 'What type of data projects do you handle?',
    category: 'Services & Capabilities',
    a: 'Data cleaning and analysis, Power BI dashboards, machine learning models (churn, risk, segmentation), forecasting, deep learning / computer vision tasks, RAG & LLM applications, AI workflow automation, and web research / data extraction projects.',
  },
  {
    q: 'Can you work with Excel or CSV files?',
    category: 'Services & Capabilities',
    a: 'Yes. Excel and CSV are the most common starting point. I regularly clean, consolidate and analyze spreadsheet data — and can set up repeatable pipelines so it stays updated.',
  },
  {
    q: 'Can you build Power BI dashboards?',
    category: 'Services & Capabilities',
    a: 'Yes — from data modeling and DAX measures to full dashboard design with drill-through, bookmarks and mobile layouts, tailored to your KPIs.',
  },
  {
    q: 'Can you develop machine learning models?',
    category: 'Services & Capabilities',
    a: 'Yes. Classification, regression and clustering problems including churn prediction, risk scoring and customer segmentation — always with honest evaluation and explainability.',
  },
  {
    q: 'Can you build forecasting systems?',
    category: 'Services & Capabilities',
    a: 'Yes — sales, demand and revenue forecasting with trend/seasonality analysis, back-tested accuracy and refreshable pipelines.',
  },
  {
    q: 'Do you build RAG and LLM applications?',
    category: 'Services & Capabilities',
    a: 'Yes — document Q&A assistants, knowledge bases and semantic search built with retrieval-augmented generation so answers are grounded in your own documents.',
  },
  {
    q: 'Can you automate an existing business workflow?',
    category: 'Services & Capabilities',
    a: 'Yes. I map your current process and automate repetitive steps with Python scripts, tool integrations and AI steps — n8n-style where appropriate.',
  },
  {
    q: 'Can you work with existing code?',
    category: 'Working Together',
    a: 'Yes. I can review, extend, debug and document existing Python/SQL codebases, notebooks and reports.',
  },
  {
    q: 'Can you work remotely with international clients?',
    category: 'Working Together',
    a: 'Yes — I work remotely with clients worldwide and am experienced in clear asynchronous communication across time zones.',
  },
  {
    q: 'Can I hire you through Upwork or Freelancer?',
    category: 'Working Together',
    a: 'Absolutely. You can hire me on Upwork or Freelancer.com using the buttons on this site — platform-based contracts are welcome.',
  },
  {
    q: 'Can I contact you through WhatsApp?',
    category: 'Communication & Legal',
    a: 'Yes — the WhatsApp button on this site opens a chat with a prefilled message so you can describe your project right away.',
  },
  {
    q: 'Can you sign an NDA?',
    category: 'Communication & Legal',
    a: 'NDA signing can be discussed and agreed before the project starts, so your information stays protected. Project estimates remain subject to confirmed scope, and timelines depend on requirements.',
  },
]

/* ------------------------------ Project inquiry --------------------------- */

export const projectCategoriesForm = [
  'Data Analysis',
  'Power BI Dashboard',
  'SQL',
  'Data Cleaning',
  'Machine Learning',
  'Forecasting',
  'Deep Learning',
  'Computer Vision',
  'NLP',
  'AI / LLM',
  'RAG',
  'AI Automation',
  'Web Research',
  'Data Extraction',
  'Custom Project',
  'Not sure — discuss my project',
]

export const budgetRanges = ['Under $100', '$100 – $300', '$300 – $1,000', '$1,000 – $5,000', '$5,000+', 'Not sure yet']

export const contactMethods = ['WhatsApp', 'Telegram', 'Phone Call', 'Email', 'LinkedIn', 'Upwork', 'Freelancer']

export const processFlow = [
  'Client submits requirements',
  'Confirmation & consultation',
  'Scope confirmation',
  'Quotation',
  'Client approval',
  'Project starts',
]

/* ------------------------------ Before / After ---------------------------- */

export const beforeAfter = {
  before: {
    title: 'Before',
    points: [
      'Data scattered in exports and spreadsheets',
      'Numbers nobody fully trusts',
      'Reports assembled manually for days',
      'Decisions based on gut feeling',
    ],
  },
  after: {
    title: 'After',
    points: [
      'Clean, documented, trusted dataset',
      'Live dashboards for every stakeholder',
      'Predictions with known accuracy',
      'Automated workflows and clear reports',
    ],
  },
}

/* --------------------------------- Insights -------------------------------- */
// Editorial articles demonstrating expertise (brief §55-56). Add new articles
// here — no component changes needed. Keep content educational and honest.

export interface InsightArticle {
  slug: string
  title: string
  category: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  sections: { heading: string; body: string[]; bullets?: string[] }[]
}

export const insights: InsightArticle[] = [
  {
    slug: 'clean-messy-business-data',
    title: 'How to Clean Messy Business Data Before Any Analysis',
    category: 'Data Analytics',
    excerpt:
      'Most "insights" fail before the first chart is drawn — because the data underneath was never trusted. A practical checklist for cleaning business data the reproducible way.',
    date: '2025-11-02',
    readTime: '6 min read',
    tags: ['Data Cleaning', 'EDA', 'Excel', 'Python'],
    sections: [
      {
        heading: 'Why cleaning comes first',
        body: [
          'Every data project has two phases that look boring but decide everything: profiling and cleaning. Skip them and your dashboard shows numbers nobody trusts, your model learns noise, and your report gets questioned in the meeting that matters.',
          'Cleaning is not "fixing errors" — it is making implicit business rules explicit: what counts as a customer, what happens to cancelled orders, which currency a column is in, and why two systems disagree about the same invoice.',
        ],
      },
      {
        heading: 'The profiling checklist',
        body: ['Before touching anything, answer these questions for every column:'],
        bullets: [
          'Missing values — how many, and is missingness itself meaningful (e.g. customers who never provided a phone number)?',
          'Duplicates — exact duplicates, and worse: near-duplicates (same customer, slightly different spelling)',
          'Types & ranges — dates stored as text, negative ages, charges below zero',
          'Consistency — "USA" vs "U.S." vs "United States" in the same column',
          'Granularity — is this table one row per order, per customer, or per month?',
        ],
      },
      {
        heading: 'Cleaning rules that survive audits',
        body: [
          'Never clean the raw file by hand. Write the cleaning as repeatable steps (a Python script or documented Power Query), so next month\'s export can be processed identically — and so anyone can verify what was changed.',
          'Keep a raw copy untouched, output a cleaned version, and record every transformation in a data dictionary. When a stakeholder asks "why does this row differ from our ERP?", you answer in seconds instead of days.',
        ],
      },
      {
        heading: 'What good looks like',
        body: [
          'A clean dataset is boring in the best way: consistent types, documented columns, validated totals that reconcile with the source system, and a summary of every issue found and how it was handled. That boring foundation is what makes every later chart, model and decision trustworthy.',
        ],
      },
    ],
  },
  {
    slug: 'kpi-dashboards-people-use',
    title: 'Designing KPI Dashboards People Actually Use',
    category: 'Power BI & BI',
    excerpt:
      'A dashboard is not a report with charts. It is a decision instrument. Four principles that separate dashboards that get opened daily from those opened once.',
    date: '2025-11-20',
    readTime: '5 min read',
    tags: ['Power BI', 'KPI', 'Data Visualization'],
    sections: [
      {
        heading: 'Start from the decision, not the data',
        body: [
          'The first question for any dashboard is not "what data do we have?" but "what decision will someone make faster or better because of this screen?" If you cannot name the decision, the dashboard becomes a decoration — visited in week one, ignored by week three.',
        ],
      },
      {
        heading: 'One screen, one question',
        body: [
          'Executives need a single view: is the business on track? Operations need drill-down: which region, which product, which week? Design the top layer for the question that recurs daily, and put detail one click away — not on the same canvas.',
        ],
        bullets: [
          'KPI cards show value + trend + target variance — nothing else',
          'Charts answer "why" only after cards answer "what"',
          'Consistent time grain across all visuals (never mix weekly and monthly in one view)',
          'Explicit filters: period, region, product — always visible, never hidden',
        ],
      },
      {
        heading: 'Trust is a feature',
        body: [
          'Every number needs a lineage: which tables, which filters, which refresh time. Show "data as of" timestamps. Define each KPI once, in writing, and make the dashboard match that definition — not the other way around.',
          'A dashboard that quietly disagrees with finance\'s spreadsheet is worse than no dashboard. Reconcile first, publish second.',
        ],
      },
      {
        heading: 'Adoption checklist',
        body: ['Before calling a dashboard finished, verify:'],
        bullets: [
          'A first-time user finds the answer to the core question in under 10 seconds',
          'Every visual has one obvious takeaway (title states the insight, not the chart type)',
          'Mobile layout works, because decisions happen in meetings, not at desks',
          'There is a named owner and a refresh process',
        ],
      },
    ],
  },
  {
    slug: 'churn-prediction-to-retention',
    title: 'Customer Churn Prediction: From Data to Retention Actions',
    category: 'Machine Learning',
    excerpt:
      'A churn model is only as valuable as the retention action it triggers. How to frame, build and operationalize churn prediction so it changes what the business does on Monday.',
    date: '2025-12-08',
    readTime: '7 min read',
    tags: ['Churn', 'Classification', 'Explainable AI'],
    sections: [
      {
        heading: 'Define churn precisely',
        body: [
          'Before any modeling, agree on the definition: for a subscription product churn is usually explicit cancellation; for e-commerce it might be "no purchase in 90 days when the historical median gap is 30". A fuzzy target produces a model that is accurate on paper and useless in practice.',
        ],
      },
      {
        heading: 'Build the baseline before the model',
        body: [
          'A logistic regression on three solid features (tenure, contract type, recent complaints) that the retention team understands beats a black-box ensemble nobody acts on. Get the baseline working end to end — data to ranked contact list — then improve the model iteratively.',
        ],
        bullets: [
          'Frame it as ranking, not classification: who are the top 100 highest-risk customers this week?',
          'Handle class imbalance consciously — churners are usually the minority',
          'Evaluate with business metrics: precision at top-N, not raw accuracy',
          'Explain every score: feature importance per customer, in plain language',
        ],
      },
      {
        heading: 'Operationalize or perish',
        body: [
          'The model must land inside an existing workflow: a scheduled scoring job that refreshes a CRM list, with an owner, a review cadence and a feedback loop — did contacted customers stay? Without the loop, quality drifts silently as customer behavior changes.',
        ],
      },
      {
        heading: 'Honest limitations',
        body: [
          'Models trained on last year\'s customers encode last year\'s world. Set up drift monitoring, re-train on a schedule, and treat any accuracy claim as valid only for the data it was evaluated on — a principle that separates professional ML work from demo theater.',
        ],
      },
    ],
  },
  {
    slug: 'rag-in-practice',
    title: 'RAG in Practice: AI Assistants Grounded in Your Documents',
    category: 'AI & LLM',
    excerpt:
      'Retrieval-Augmented Generation turns a general-purpose LLM into an assistant that answers from your documents — with citations. What it takes to build one that is actually reliable.',
    date: '2026-01-15',
    readTime: '6 min read',
    tags: ['RAG', 'LLM', 'Embeddings', 'Vector Search'],
    sections: [
      {
        heading: 'Why RAG instead of fine-tuning',
        body: [
          'Most "the AI doesn\'t know our documents" problems are retrieval problems, not knowledge problems. Fine-tuning teaches style, not facts. RAG keeps your documents as the source of truth, retrieves the relevant passages at question time, and instructs the LLM to answer only from them — with citations you can click and verify.',
        ],
      },
      {
        heading: 'The pipeline that matters',
        body: ['A production RAG system is four steps, and quality lives in each:'],
        bullets: [
          'Ingestion — parse PDFs/DOCX reliably; tables and headers are where quality dies',
          'Chunking — split by semantic sections, not fixed character counts; keep titles with their text',
          'Retrieval — embeddings + vector search, often hybrid with keyword matching',
          'Generation — grounded prompts that refuse to answer when retrieval finds nothing relevant',
        ],
      },
      {
        heading: 'Evaluate like an engineer',
        body: [
          'Build a test set of real questions with known source passages. Measure retrieval hit-rate before answer quality. An assistant that retrieves the right paragraph but phrases it imperfectly is fixable; one that retrieves the wrong document is not.',
        ],
      },
      {
        heading: 'Where it fails',
        body: [
          'Scanned documents without OCR, conflicting versions of the same policy, and questions that require math across many documents are the three most common failure modes. Design for them early — scope the assistant to the questions your document set can actually support, and it will earn trust instead of burning it.',
        ],
      },
    ],
  },
]

/* ------------------------------- Career journey ---------------------------- */

/**
 * The professional story, as a logical progression:
 * Engineering → Professional Experience → Project & Technical Delivery →
 * Data Analytics → Data Science → Machine Learning → Deep Learning → AI.
 * Every stage is grounded in the verified CV — no invented dates or titles.
 */
export const careerJourney = [
  {
    stage: 'Foundation',
    title: 'Civil Engineering',
    body: 'Started as a BSc Engineer (Civil) — trained to think in structures, loads and precision. Engineering taught me to break complex systems into measurable parts and to respect safety factors.',
    tags: ['BSc Engineer (Civil)', 'Analytical Thinking'],
  },
  {
    stage: 'Professional Experience',
    title: 'International Engineering Practice — UAE',
    body: 'On-site engineering delivery in an international environment: documentation, quality and safety-aware execution, and coordination across cultures and disciplines.',
    tags: ['UAE', 'Site Delivery', 'Documentation'],
  },
  {
    stage: 'Industry Experience',
    title: 'Telecom Engineering — Teletalk Bangladesh Limited',
    body: 'Telecom engineering operations, technical reporting and infrastructure coordination with cross-functional teams — where data-driven monitoring of operational performance became a daily habit.',
    tags: ['Teletalk Bangladesh', 'Operations', 'Technical Reporting'],
  },
  {
    stage: 'Delivery Discipline',
    title: 'Project & Delivery Management — PRINCE2®',
    body: 'Certified PRINCE2® Foundation & Practitioner (ECADEME, Bangladesh). Projects started to be managed with explicit scope, plans, risks and communication — the same discipline I now apply to data projects.',
    tags: ['PRINCE2®', 'Planning', 'Stakeholders'],
  },
  {
    stage: 'Data Analytics',
    title: 'From Data to Decisions',
    body: 'Python, SQL and Power BI became daily tools: cleaning messy data, exploratory analysis, statistics and KPI dashboards that answer real business questions.',
    tags: ['Python', 'SQL', 'Power BI', 'EDA'],
  },
  {
    stage: 'Data Science & ML',
    title: 'Predictive Modeling & Machine Learning',
    body: 'IBM Data Science (Coursera) and Machine Learning A-Z™ (Udemy) formalized the transition: regression, classification, clustering and honest model evaluation applied to real datasets.',
    tags: ['IBM Data Science', 'Machine Learning A-Z™', 'scikit-learn'],
  },
  {
    stage: 'Deep Learning',
    title: 'Neural Networks with TensorFlow & Keras',
    body: 'Went deeper with TensorFlow and Keras — building and training neural networks for prediction tasks, with the engineering rigor to validate results properly.',
    tags: ['TensorFlow', 'Keras', 'Neural Networks'],
  },
  {
    stage: 'Big Data',
    title: 'Big Data & FusionInsight HD — Hangzhou, China',
    body: 'International training in Hangzhou on big data platforms and FusionInsight HD — distributed storage and processing for datasets beyond a single machine.',
    tags: ['Big Data', 'FusionInsight HD', 'Distributed Systems'],
  },
  {
    stage: 'Applied AI',
    title: 'AI Solutions, RAG & Automation',
    body: 'Today: LLM-powered assistants with retrieval-augmented generation, AI workflow automation and end-to-end intelligent solutions — combining every previous stage.',
    tags: ['LLM', 'RAG', 'AI Automation', 'n8n'],
  },
]

/* ----------------------------- SEO & structured --------------------------- */

export const seo = {
  siteName: 'Shah Muhammad Fazle Rabbi — Data Science, ML & AI',
  title: 'Shah Muhammad Fazle Rabbi | Data Scientist, Machine Learning Engineer & AI Analytics Specialist',
  description:
    'I turn data into insights, predictions, and practical AI solutions. Data analytics, Power BI dashboards, machine learning, forecasting, RAG/LLM applications and AI automation — delivered with engineering discipline.',
  keywords: [
    'Data Scientist Bangladesh',
    'Machine Learning Engineer',
    'Freelance Data Scientist',
    'Remote Data Scientist',
    'Python Data Scientist',
    'Power BI Developer',
    'Predictive Analytics',
    'AI Automation Specialist',
    'RAG Developer',
    'AI/ML Consultant',
    'Deep Learning TensorFlow Keras',
    'Data Analyst Dhaka',
    'SQL Power BI Expert',
    'AI Solutions',
  ],
}


/* ============================================================================
 * ADMIN-EDITABLE EXTRAS + CONTENT OVERRIDES
 * ----------------------------------------------------------------------------
 * Everything above is the DEFAULT content. The admin panel (/admin) stores
 * edits in the Google Sheet; at build time they are written to
 * src/content/overrides.json and applied here, so the statically exported
 * HTML (what search engines see) always contains the edited content.
 * ========================================================================== */

/** Discovery-call rules. The database enforces the same values (live). */
export const bookingSettings = {
  slotMinutes: 30,
  /** Dhaka weekdays: 0 = Sunday … 6 = Saturday */
  workdays: [0, 1, 2, 3, 4] as number[],
  startHourDhaka: 10,
  endHourDhaka: 18,
  leadTimeMinutes: 180,
  calendarDaysAhead: 20,
  maxDays: 12,
  /** Holiday / blackout days, 'YYYY-MM-DD' in Dhaka time */
  blockedDateKeys: [] as string[],
}

export interface PageSeoOverride {
  title?: string
  description?: string
  keywords?: string[]
  /** Absolute URL or /path of the social-share image */
  image?: string
}
/** Per-page SEO overrides keyed by path, e.g. { "/about": { title: "…", description: "…" } } */
export const pageSeo: Record<string, PageSeoOverride> = {}

/** Homepage sections in their default order (ids are stable keys used by src/app/page.tsx). */
export const HOME_SECTION_IDS = [
  'hero', 'trustBar', 'services', 'solutions', 'projects', 'kaggle', 'demos', 'caseStudies', 'experience', 'skills',
  'certifications', 'platforms', 'testimonials', 'pricing', 'faq', 'insights', 'about', 'startProject', 'bookCall', 'contact',
] as const

export interface Testimonial {
  name: string
  role: string
  company: string
  quote: string
  /** Optional portrait (square works best). */
  photo?: string
  photoAlt?: string
  /** Link to the original review (Upwork, Freelancer, LinkedIn …). */
  sourceUrl?: string
  published?: boolean
}
/** Client testimonials — add them in Admin → Testimonials. While empty, a placeholder is shown. */
export const testimonials: Testimonial[] = []

/** Admin: show / hide / reorder the homepage sections. */
export const homeSections: { id: string; label: string; visible: boolean }[] = [
  { id: 'hero', label: 'Hero — top banner', visible: true },
  { id: 'trustBar', label: 'Trust bar', visible: true },
  { id: 'services', label: 'Services — "What I Can Do For You"', visible: true },
  { id: 'solutions', label: 'What I Can Solve', visible: true },
  { id: 'projects', label: 'Projects & Case Work', visible: true },
  { id: 'kaggle', label: 'Kaggle — Competitions, Notebooks & Dataset Work', visible: true },
  { id: 'demos', label: 'Demo showcase', visible: true },
  { id: 'caseStudies', label: 'Case studies — "Deep Dives"', visible: true },
  { id: 'experience', label: 'Experience', visible: true },
  { id: 'skills', label: 'Skills', visible: true },
  { id: 'certifications', label: 'Certifications', visible: true },
  { id: 'platforms', label: 'Professional profiles', visible: true },
  { id: 'testimonials', label: 'Testimonials', visible: true },
  { id: 'pricing', label: 'Pricing', visible: true },
  { id: 'faq', label: 'FAQ', visible: true },
  { id: 'insights', label: 'Insights — "Notes From the Field"', visible: true },
  { id: 'about', label: 'About me', visible: true },
  { id: 'startProject', label: 'Start a Project (inquiry form)', visible: true },
  { id: 'bookCall', label: 'Book a call', visible: true },
  { id: 'contact', label: 'Contact', visible: true },
]

/** Admin: extra links in the "Pages" menu for homepage-only sections (no dedicated page). */
export const homeOnlyLinks: { label: string; href: string }[] = [
  { label: 'Pricing', href: '/#pricing' },
  { label: 'What I Solve', href: '/#solutions' },
  { label: 'Insights', href: '/#insights' },
  { label: 'FAQ', href: '/#faq' },
]

/**
 * Admin: text replacements. Key = the built-in text, value = your text.
 * Applies to every section heading (eyebrow / title / description) and the
 * menu / button labels listed in src/config/ui-text-registry.json.
 */
export const uiText: Record<string, string> = {}

/** The built-in homepage section list, captured BEFORE saved admin overrides replace `homeSections`. */
export const defaultHomeSections: { id: string; label: string; visible: boolean }[] = homeSections.map((r) => ({ ...r }))

const overrides = contentOverrides as Record<string, unknown>
applyContentOverrides(
  {
    profile, social, kaggleActivities, notableRepos, navLinks, allNavLinks, sitePages, trustBar, about,
    services, solutions, transformationFlow, projectCategories, projects, caseStudies, skillGroups,
    experience, credentials, memberships, platforms, pricingModels, priceFactors, estimateOptions,
    faqCategories, faqs, projectCategoriesForm, budgetRanges, contactMethods, processFlow, beforeAfter,
    insights, careerJourney, seo, bookingSettings, pageSeo, homeSections, homeOnlyLinks, uiText, testimonials,
  },
  overrides
)
// Items the admin switched to Inactive / Unpublished are removed from the site.
for (const list of [services, projects, caseStudies, skillGroups, credentials, kaggleActivities, experience,
  testimonials, faqs, insights, platforms, memberships, notableRepos, careerJourney, solutions] as { published?: boolean }[][]) {
  const shown = list.filter((item) => item.published !== false)
  if (shown.length !== list.length) list.splice(0, list.length, ...shown)
}

const text = (k: string) => (typeof overrides[k] === 'string' ? (overrides[k] as string) : undefined)
testimonialsPlaceholder = text('testimonialsPlaceholder') ?? testimonialsPlaceholder
pricingNote = text('pricingNote') ?? pricingNote
estimateRushNote = text('estimateRushNote') ?? estimateRushNote
estimateDisclaimer = text('estimateDisclaimer') ?? estimateDisclaimer
// The canonical site URL always comes from the build environment, never from the database.
profile.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
