'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { 
  Target, Briefcase, Camera, DollarSign, 
  Plus, Check, Sunrise, Heart, Dumbbell,
  Code, Palette, Megaphone, FileText, Zap
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  type: 'habit' | 'project' | 'instagram' | 'freelance'
  icon: any
  color: string
  items: any[]
}

const habitTemplates: Template[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day right with these essential habits',
    type: 'habit',
    icon: Sunrise,
    color: 'orange',
    items: [
      { 
        name: 'Wake up at 6 AM', 
        emoji: '🌅', 
        category: 'morning', 
        type: 'boolean',
        description: 'Start your day early for better productivity'
      },
      { 
        name: 'Drink water', 
        emoji: '💧', 
        category: 'health', 
        type: 'numeric', 
        target_value: 500, 
        target_unit: 'ml',
        description: 'Hydrate your body after sleep'
      },
      { 
        name: 'Morning meditation', 
        emoji: '🧘', 
        category: 'morning', 
        type: 'numeric', 
        target_value: 10, 
        target_unit: 'minutes',
        description: 'Center your mind for the day ahead'
      },
      { 
        name: 'Exercise', 
        emoji: '💪', 
        category: 'health', 
        type: 'numeric', 
        target_value: 30, 
        target_unit: 'minutes',
        description: 'Get your body moving and energized'
      },
      { 
        name: 'Healthy breakfast', 
        emoji: '🥗', 
        category: 'health', 
        type: 'boolean',
        description: 'Fuel your body with nutritious food'
      },
      { 
        name: 'Review daily goals', 
        emoji: '📋', 
        category: 'focus', 
        type: 'boolean',
        description: 'Plan and prioritize your day'
      }
    ]
  },
  {
    id: 'deep-work-focus',
    name: 'Deep Work & Focus',
    description: 'Maximize productivity with focused work sessions',
    type: 'habit',
    icon: Zap,
    color: 'yellow',
    items: [
      { 
        name: 'Deep work session', 
        emoji: '🎯', 
        category: 'work', 
        type: 'numeric', 
        target_value: 90, 
        target_unit: 'minutes',
        description: 'Uninterrupted focused work time'
      },
      { 
        name: 'Pomodoro sessions', 
        emoji: '🍅', 
        category: 'work', 
        type: 'numeric', 
        target_value: 4, 
        target_unit: 'sessions',
        description: '25-minute focused work blocks'
      },
      { 
        name: 'No distractions', 
        emoji: '📵', 
        category: 'focus', 
        type: 'boolean',
        description: 'Phone on silent, notifications off'
      },
      { 
        name: 'Single-tasking', 
        emoji: '🎯', 
        category: 'focus', 
        type: 'boolean',
        description: 'Focus on one task at a time'
      },
      { 
        name: 'Learning session', 
        emoji: '📚', 
        category: 'focus', 
        type: 'numeric', 
        target_value: 30, 
        target_unit: 'minutes',
        description: 'Dedicated time for skill development'
      }
    ]
  },
  {
    id: 'fitness-journey',
    name: 'Fitness Journey',
    description: 'Complete workout and nutrition tracking',
    type: 'habit',
    icon: Dumbbell,
    color: 'red',
    items: [
      { 
        name: 'Morning workout', 
        emoji: '🏋️', 
        category: 'health', 
        type: 'numeric', 
        target_value: 45, 
        target_unit: 'minutes',
        description: 'Strength training or cardio session'
      },
      { 
        name: 'Drink water', 
        emoji: '💧', 
        category: 'health', 
        type: 'numeric', 
        target_value: 2000, 
        target_unit: 'ml',
        description: 'Stay hydrated throughout the day'
      },
      { 
        name: 'Track nutrition', 
        emoji: '🍎', 
        category: 'health', 
        type: 'boolean',
        description: 'Log meals and calories'
      },
      { 
        name: 'Protein intake', 
        emoji: '🥩', 
        category: 'health', 
        type: 'numeric', 
        target_value: 150, 
        target_unit: 'g',
        description: 'Meet daily protein goals'
      },
      { 
        name: 'Steps walked', 
        emoji: '👟', 
        category: 'health', 
        type: 'numeric', 
        target_value: 10000, 
        target_unit: 'steps',
        description: 'Daily step count goal'
      },
      { 
        name: 'Evening stretch', 
        emoji: '🤸', 
        category: 'night', 
        type: 'numeric', 
        target_value: 15, 
        target_unit: 'minutes',
        description: 'Flexibility and recovery'
      }
    ]
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness & Wellness',
    description: 'Mental health and self-care routine',
    type: 'habit',
    icon: Heart,
    color: 'pink',
    items: [
      { 
        name: 'Morning gratitude', 
        emoji: '🙏', 
        category: 'morning', 
        type: 'boolean',
        description: 'Write 3 things you\'re grateful for'
      },
      { 
        name: 'Meditation', 
        emoji: '🧘', 
        category: 'focus', 
        type: 'numeric', 
        target_value: 20, 
        target_unit: 'minutes',
        description: 'Mindfulness or breathing meditation'
      },
      { 
        name: 'Journaling', 
        emoji: '📝', 
        category: 'focus', 
        type: 'numeric', 
        target_value: 10, 
        target_unit: 'minutes',
        description: 'Reflect on thoughts and feelings'
      },
      { 
        name: 'Reading', 
        emoji: '📖', 
        category: 'night', 
        type: 'numeric', 
        target_value: 30, 
        target_unit: 'minutes',
        description: 'Read for pleasure or learning'
      },
      { 
        name: 'Digital detox', 
        emoji: '📱', 
        category: 'night', 
        type: 'boolean',
        description: 'No screens 1 hour before bed'
      },
      { 
        name: 'Self-care activity', 
        emoji: '🛁', 
        category: 'night', 
        type: 'boolean',
        description: 'Bath, skincare, or relaxation'
      }
    ]
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur Essentials',
    description: 'Build and grow your business daily',
    type: 'habit',
    icon: Briefcase,
    color: 'blue',
    items: [
      { 
        name: 'Market research', 
        emoji: '📊', 
        category: 'work', 
        type: 'numeric', 
        target_value: 30, 
        target_unit: 'minutes',
        description: 'Study competitors and trends'
      },
      { 
        name: 'Product development', 
        emoji: '🛠️', 
        category: 'work', 
        type: 'numeric', 
        target_value: 120, 
        target_unit: 'minutes',
        description: 'Build or improve your product'
      },
      { 
        name: 'Customer outreach', 
        emoji: '📞', 
        category: 'work', 
        type: 'numeric', 
        target_value: 5, 
        target_unit: 'contacts',
        description: 'Connect with potential customers'
      },
      { 
        name: 'Content creation', 
        emoji: '✍️', 
        category: 'work', 
        type: 'boolean',
        description: 'Blog, social media, or marketing content'
      },
      { 
        name: 'Financial review', 
        emoji: '💰', 
        category: 'work', 
        type: 'boolean',
        description: 'Check revenue, expenses, and metrics'
      },
      { 
        name: 'Network building', 
        emoji: '🤝', 
        category: 'work', 
        type: 'boolean',
        description: 'Connect with other entrepreneurs'
      }
    ]
  }
]

const projectTemplates: Template[] = [
  {
    id: 'web-app',
    name: 'Full-Stack Web App',
    description: 'Complete web application development workflow',
    type: 'project',
    icon: Code,
    color: 'blue',
    items: [
      { name: 'Project setup & initialization', description: 'Set up development environment and project structure', priority: 'high', status: 'pending' },
      { name: 'Database schema design', description: 'Design and create database tables and relationships', priority: 'high', status: 'pending' },
      { name: 'Authentication system', description: 'Implement user registration, login, and security', priority: 'high', status: 'pending' },
      { name: 'API endpoints development', description: 'Create REST API or GraphQL endpoints', priority: 'high', status: 'pending' },
      { name: 'Frontend UI components', description: 'Build reusable UI components and layouts', priority: 'medium', status: 'pending' },
      { name: 'State management setup', description: 'Implement Redux, Zustand, or Context API', priority: 'medium', status: 'pending' },
      { name: 'Testing implementation', description: 'Unit tests, integration tests, and E2E tests', priority: 'medium', status: 'pending' },
      { name: 'Performance optimization', description: 'Code splitting, lazy loading, and caching', priority: 'low', status: 'pending' },
      { name: 'Deployment & CI/CD', description: 'Set up automated deployment pipeline', priority: 'medium', status: 'pending' },
      { name: 'Documentation & README', description: 'Write comprehensive project documentation', priority: 'low', status: 'pending' }
    ]
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Development',
    description: 'React Native or Flutter mobile app project',
    type: 'project',
    icon: Briefcase,
    color: 'purple',
    items: [
      { name: 'App concept & planning', description: 'Define app purpose, target audience, and features', priority: 'high', status: 'pending' },
      { name: 'UI/UX design system', description: 'Create wireframes, mockups, and design tokens', priority: 'high', status: 'pending' },
      { name: 'Development environment', description: 'Set up React Native/Flutter development tools', priority: 'high', status: 'pending' },
      { name: 'Navigation structure', description: 'Implement app navigation and routing', priority: 'high', status: 'pending' },
      { name: 'Core features development', description: 'Build main app functionality and screens', priority: 'high', status: 'pending' },
      { name: 'API integration', description: 'Connect to backend services and APIs', priority: 'medium', status: 'pending' },
      { name: 'Push notifications', description: 'Implement Firebase or native push notifications', priority: 'medium', status: 'pending' },
      { name: 'App store preparation', description: 'Icons, screenshots, and store listings', priority: 'low', status: 'pending' },
      { name: 'Beta testing', description: 'TestFlight/Play Console beta testing', priority: 'medium', status: 'pending' },
      { name: 'Launch & marketing', description: 'App store submission and promotion', priority: 'low', status: 'pending' }
    ]
  },
  {
    id: 'saas-product',
    name: 'SaaS Product Launch',
    description: 'Complete SaaS product development and launch',
    type: 'project',
    icon: Zap,
    color: 'green',
    items: [
      { name: 'Market research & validation', description: 'Validate problem and solution fit', priority: 'high', status: 'pending' },
      { name: 'MVP feature definition', description: 'Define minimum viable product features', priority: 'high', status: 'pending' },
      { name: 'Technical architecture', description: 'Choose tech stack and system architecture', priority: 'high', status: 'pending' },
      { name: 'Landing page & branding', description: 'Create brand identity and marketing site', priority: 'medium', status: 'pending' },
      { name: 'Core product development', description: 'Build MVP with essential features', priority: 'high', status: 'pending' },
      { name: 'Payment integration', description: 'Implement Stripe, PayPal, or other payment systems', priority: 'high', status: 'pending' },
      { name: 'User onboarding flow', description: 'Design smooth user registration and setup', priority: 'medium', status: 'pending' },
      { name: 'Analytics & tracking', description: 'Implement user behavior and business metrics', priority: 'medium', status: 'pending' },
      { name: 'Customer support system', description: 'Set up help desk and documentation', priority: 'low', status: 'pending' },
      { name: 'Marketing & launch campaign', description: 'Plan and execute product launch', priority: 'medium', status: 'pending' }
    ]
  },
  {
    id: 'ai-project',
    name: 'AI/ML Project',
    description: 'Machine learning or AI application development',
    type: 'project',
    icon: Target,
    color: 'indigo',
    items: [
      { name: 'Problem definition & scope', description: 'Define ML problem type and success metrics', priority: 'high', status: 'pending' },
      { name: 'Data collection & preparation', description: 'Gather, clean, and preprocess training data', priority: 'high', status: 'pending' },
      { name: 'Exploratory data analysis', description: 'Analyze data patterns and feature importance', priority: 'high', status: 'pending' },
      { name: 'Model selection & training', description: 'Choose and train appropriate ML models', priority: 'high', status: 'pending' },
      { name: 'Model evaluation & tuning', description: 'Validate performance and optimize hyperparameters', priority: 'high', status: 'pending' },
      { name: 'API development', description: 'Create REST API for model inference', priority: 'medium', status: 'pending' },
      { name: 'Frontend interface', description: 'Build user interface for model interaction', priority: 'medium', status: 'pending' },
      { name: 'Model deployment', description: 'Deploy to cloud platform (AWS, GCP, Azure)', priority: 'medium', status: 'pending' },
      { name: 'Monitoring & logging', description: 'Set up model performance monitoring', priority: 'low', status: 'pending' },
      { name: 'Documentation & presentation', description: 'Document methodology and create demo', priority: 'low', status: 'pending' }
    ]
  }
]

const instagramTemplates: Template[] = [
  {
    id: 'content-creator',
    name: 'Content Creator Pack',
    description: '30-day content calendar for creators',
    type: 'instagram',
    icon: Palette,
    color: 'pink',
    items: [
      { 
        title: 'Introduction post', 
        format: 'post', 
        status: 'idea',
        hook: 'Hey everyone! Let me introduce myself...',
        caption: 'Welcome to my page! Here\'s what you can expect from me...',
        hashtags: '#introduction #contentcreator #newpost #hello'
      },
      { 
        title: 'Behind the scenes', 
        format: 'reel', 
        status: 'idea',
        hook: 'What my workspace actually looks like...',
        caption: 'The reality behind content creation! Not always glamorous but always worth it 💪',
        hashtags: '#behindthescenes #reality #contentcreation #workspace'
      },
      { 
        title: 'Tutorial/How-to', 
        format: 'reel', 
        status: 'idea',
        hook: 'Here\'s how I do [specific skill]...',
        caption: 'Step-by-step tutorial! Save this post for later 📌',
        hashtags: '#tutorial #howto #tips #education #learn'
      },
      { 
        title: 'Day in the life', 
        format: 'story', 
        status: 'idea',
        hook: 'Come spend the day with me!',
        caption: 'My typical Monday routine - what does yours look like?',
        hashtags: '#dayinthelife #routine #lifestyle #monday'
      },
      { 
        title: 'Tips & tricks', 
        format: 'post', 
        status: 'idea',
        hook: '5 game-changing tips for...',
        caption: 'These tips changed everything for me! Which one will you try first?',
        hashtags: '#tips #tricks #advice #productivity #growth'
      },
      { 
        title: 'Q&A session', 
        format: 'story', 
        status: 'idea',
        hook: 'Ask me anything!',
        caption: 'Your questions answered! Keep them coming 💬',
        hashtags: '#qna #askmeanything #questions #community'
      },
      { 
        title: 'Transformation/Before-After', 
        format: 'post', 
        status: 'idea',
        hook: 'The glow up is real...',
        caption: 'Progress over perfection! What transformation are you working on?',
        hashtags: '#transformation #beforeafter #progress #growth #journey'
      },
      { 
        title: 'Collaboration post', 
        format: 'reel', 
        status: 'idea',
        hook: 'Collabing with amazing creators!',
        caption: 'So grateful for this collaboration! Check out @partner for more amazing content',
        hashtags: '#collaboration #partnership #creators #community #grateful'
      }
    ]
  },
  {
    id: 'business-brand',
    name: 'Business Brand',
    description: 'Professional business content strategy',
    type: 'instagram',
    icon: Briefcase,
    color: 'blue',
    items: [
      { 
        title: 'Company introduction', 
        format: 'post', 
        status: 'idea',
        hook: 'Meet the team behind [Company Name]',
        caption: 'We\'re passionate about [mission]. Here\'s our story and what drives us every day.',
        hashtags: '#aboutus #company #team #mission #business'
      },
      { 
        title: 'Product showcase', 
        format: 'reel', 
        status: 'idea',
        hook: 'Our product in action!',
        caption: 'See how [Product] can transform your [specific benefit]. Link in bio to learn more!',
        hashtags: '#product #showcase #demo #innovation #solution'
      },
      { 
        title: 'Customer testimonial', 
        format: 'post', 
        status: 'idea',
        hook: 'What our customers are saying...',
        caption: 'Nothing makes us happier than hearing success stories from our amazing customers! 🙌',
        hashtags: '#testimonial #customer #success #review #grateful'
      },
      { 
        title: 'Team spotlight', 
        format: 'story', 
        status: 'idea',
        hook: 'Meet [Team Member Name]',
        caption: 'Getting to know the amazing people who make our company special!',
        hashtags: '#team #spotlight #employee #culture #people'
      },
      { 
        title: 'Industry insights', 
        format: 'post', 
        status: 'idea',
        hook: 'Industry trend alert!',
        caption: 'Here\'s what we\'re seeing in [industry] and how it affects you...',
        hashtags: '#industry #insights #trends #business #knowledge'
      },
      { 
        title: 'Special offer announcement', 
        format: 'reel', 
        status: 'idea',
        hook: 'Limited time offer!',
        caption: 'Don\'t miss out on this exclusive deal! Valid until [date]. Link in bio 🔥',
        hashtags: '#sale #offer #limited #exclusive #deal'
      },
      { 
        title: 'FAQ answers', 
        format: 'story', 
        status: 'idea',
        hook: 'Your questions answered!',
        caption: 'Clearing up common questions about our [product/service]',
        hashtags: '#faq #questions #answers #help #support'
      }
    ]
  },
  {
    id: 'influencer',
    name: 'Influencer Growth',
    description: 'Viral content ideas for growth',
    type: 'instagram',
    icon: Megaphone,
    color: 'orange',
    items: [
      { 
        title: 'Trending audio reel', 
        format: 'reel', 
        status: 'idea',
        hook: 'Using trending audio for maximum reach',
        caption: 'Jumping on this trend! What\'s your favorite trending sound right now?',
        hashtags: '#trending #viral #audio #reel #fyp'
      },
      { 
        title: 'Controversial opinion', 
        format: 'post', 
        status: 'idea',
        hook: 'Unpopular opinion but...',
        caption: 'I said what I said 🤷‍♀️ What\'s your take on this?',
        hashtags: '#unpopularopinion #controversial #debate #thoughts #discussion'
      },
      { 
        title: 'Life hack/tip', 
        format: 'reel', 
        status: 'idea',
        hook: 'This life hack changed everything!',
        caption: 'Try this and thank me later! What\'s your best life hack?',
        hashtags: '#lifehack #tip #hack #productivity #smart'
      },
      { 
        title: 'Relatable meme', 
        format: 'post', 
        status: 'idea',
        hook: 'When you realize it\'s Monday again...',
        caption: 'Tag someone who needs to see this 😂',
        hashtags: '#relatable #meme #funny #mood #monday'
      },
      { 
        title: 'Challenge participation', 
        format: 'reel', 
        status: 'idea',
        hook: 'Joining the [Challenge Name] challenge!',
        caption: 'Had to try this challenge! Who else is doing it? Tag me in yours!',
        hashtags: '#challenge #trend #fun #participate #community'
      },
      { 
        title: 'Poll/engagement story', 
        format: 'story', 
        status: 'idea',
        hook: 'Help me decide!',
        caption: 'Your vote matters! Let me know what you think in the poll',
        hashtags: '#poll #vote #engagement #community #decision'
      },
      { 
        title: 'Giveaway announcement', 
        format: 'post', 
        status: 'idea',
        hook: 'GIVEAWAY TIME! 🎉',
        caption: 'To enter: 1) Follow me 2) Like this post 3) Tag 2 friends. Winner announced [date]!',
        hashtags: '#giveaway #contest #free #win #follow'
      }
    ]
  }
]

const freelanceTemplates: Template[] = [
  {
    id: 'web-development-client',
    name: 'Web Development Client',
    description: 'Complete web development project workflow',
    type: 'freelance',
    icon: Code,
    color: 'green',
    items: [
      { 
        name: 'Web Development Project',
        platform: 'upwork',
        project_title: 'Full-Stack Web Application Development',
        value: 50000,
        currency: 'INR',
        stage: 'lead',
        next_action: 'Send initial proposal',
        notes: 'React + Node.js project, 6-8 weeks timeline, includes database design and deployment'
      }
    ]
  },
  {
    id: 'mobile-app-client',
    name: 'Mobile App Client',
    description: 'React Native or Flutter app development',
    type: 'freelance',
    icon: Briefcase,
    color: 'blue',
    items: [
      { 
        name: 'Mobile App Development',
        platform: 'fiverr',
        project_title: 'Cross-Platform Mobile App Development',
        value: 75000,
        currency: 'INR',
        stage: 'in_talk',
        next_action: 'Schedule technical discussion call',
        notes: 'React Native app with backend API, iOS and Android deployment, 8-10 weeks'
      }
    ]
  },
  {
    id: 'ui-ux-design-client',
    name: 'UI/UX Design Client',
    description: 'Complete design system and prototyping',
    type: 'freelance',
    icon: Palette,
    color: 'purple',
    items: [
      { 
        name: 'UI/UX Design Project',
        platform: 'dm',
        project_title: 'SaaS Dashboard Design & Prototyping',
        value: 30000,
        currency: 'INR',
        stage: 'proposal',
        next_action: 'Send detailed design proposal with timeline',
        notes: 'Figma design system, user research, wireframes, high-fidelity mockups, prototype'
      }
    ]
  },
  {
    id: 'ecommerce-client',
    name: 'E-commerce Client',
    description: 'Online store development with payment integration',
    type: 'freelance',
    icon: DollarSign,
    color: 'emerald',
    items: [
      { 
        name: 'E-commerce Store Development',
        platform: 'other',
        project_title: 'Shopify/WooCommerce Store Setup',
        value: 40000,
        currency: 'INR',
        stage: 'active',
        next_action: 'Complete product catalog setup',
        notes: 'Custom theme, payment gateway integration, inventory management, SEO optimization'
      }
    ]
  },
  {
    id: 'content-management-client',
    name: 'Content Management Client',
    description: 'CMS development and content strategy',
    type: 'freelance',
    icon: FileText,
    color: 'indigo',
    items: [
      { 
        name: 'CMS Development Project',
        platform: 'upwork',
        project_title: 'Custom CMS with Admin Panel',
        value: 60000,
        currency: 'INR',
        stage: 'done',
        next_action: 'Request testimonial and referrals',
        notes: 'WordPress/Strapi CMS, custom admin dashboard, user roles, content workflows'
      }
    ]
  },
  {
    id: 'api-integration-client',
    name: 'API Integration Client',
    description: 'Third-party API integrations and backend services',
    type: 'freelance',
    icon: Zap,
    color: 'yellow',
    items: [
      { 
        name: 'API Integration Project',
        platform: 'fiverr',
        project_title: 'Payment Gateway & Third-party API Integration',
        value: 25000,
        currency: 'INR',
        stage: 'lead',
        next_action: 'Analyze API documentation and provide estimate',
        notes: 'Razorpay/Stripe integration, social media APIs, email service integration'
      }
    ]
  }
]

export default function TemplatesPage() {
  const { showToast } = useToast()
  const [selectedType, setSelectedType] = useState<'all' | 'habit' | 'project' | 'instagram' | 'freelance'>('all')
  const [applying, setApplying] = useState<string | null>(null)
  const supabase = createClient()

  const allTemplates = [...habitTemplates, ...projectTemplates, ...instagramTemplates, ...freelanceTemplates]
  const filteredTemplates = selectedType === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.type === selectedType)

  const applyTemplate = async (template: Template) => {
    setApplying(template.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Please log in to apply templates', 'error')
      setApplying(null)
      return
    }

    try {
      // Ensure profile exists before inserting any data
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
        if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
          throw profileError
        }
      }

      if (template.type === 'habit') {
        // Insert habits with new schema fields
        const habits = template.items.map(item => ({
          user_id: user.id,
          name: item.name,
          emoji: item.emoji || null,
          description: item.description || null,
          category: item.category,
          type: item.type,
          target_value: item.target_value || null,
          target_unit: item.target_unit || null,
          is_active: true
        }))
        
        const { error } = await supabase.from('habits').insert(habits)
        if (error) throw error
        
      } else if (template.type === 'project') {
        // Create project with tasks using new schema
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: template.name,
            description: template.description,
            status: 'idea'
          })
          .select()
          .single()
        
        if (projectError) throw projectError
        
        if (project) {
          const tasks = template.items.map(item => ({
            user_id: user.id,
            project_id: project.id,
            title: item.name,
            description: item.description || null,
            status: item.status || 'pending',
            priority: item.priority || 'medium'
          }))
          
          const { error: tasksError } = await supabase.from('tasks').insert(tasks)
          if (tasksError) throw tasksError
        }
        
      } else if (template.type === 'instagram') {
        // Insert instagram posts with new schema
        const posts = template.items.map(item => ({
          user_id: user.id,
          title: item.title,
          hook: item.hook || null,
          caption: item.caption || null,
          hashtags: item.hashtags || null,
          format: item.format,
          status: item.status || 'idea'
        }))
        
        const { error } = await supabase.from('instagram_posts').insert(posts)
        if (error) throw error
        
      } else if (template.type === 'freelance') {
        // Insert freelance clients from template
        const clients = template.items.map(item => ({
          user_id: user.id,
          name: item.name,
          platform: item.platform || 'other',
          project_title: item.project_title || null,
          value: item.value || null,
          currency: item.currency || 'INR',
          stage: item.stage || 'lead',
          next_action: item.next_action || null,
          notes: item.notes || template.description
        }))
        
        const { error } = await supabase.from('freelance_clients').insert(clients)
        if (error) throw error
      }

      showToast(`${template.name} template applied successfully!`, 'success')
    } catch (error: any) {
      console.error('Error applying template:', error)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setApplying(null)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
      red: 'from-red-500/10 to-red-500/5 border-red-500/20',
      yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20',
      pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
      indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
      blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
      purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
      green: 'from-green-500/10 to-green-500/5 border-green-500/20',
      emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Templates & Presets</h1>
        <p className="text-foreground-muted">Quick start with pre-built templates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedType === 'all'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          All Templates
        </button>
        <button
          onClick={() => setSelectedType('habit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'habit'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Target size={16} />
          Habits
        </button>
        <button
          onClick={() => setSelectedType('project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'project'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Briefcase size={16} />
          Projects
        </button>
        <button
          onClick={() => setSelectedType('instagram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'instagram'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <Camera size={16} />
          Instagram
        </button>
        <button
          onClick={() => setSelectedType('freelance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            selectedType === 'freelance'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          <DollarSign size={16} />
          Freelance
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const Icon = template.icon
          return (
            <div
              key={template.id}
              className={`bg-gradient-to-br ${getColorClasses(template.color)} rounded-2xl p-6 border`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${template.color}-500/20 rounded-xl`}>
                  <Icon size={28} className={`text-${template.color}-500`} />
                </div>
                <span className="px-3 py-1 bg-surface rounded-full text-xs font-medium capitalize">
                  {template.type}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-foreground-muted mb-4">{template.description}</p>

              <div className="mb-4">
                <div className="text-xs font-medium text-foreground-muted mb-2">
                  Includes {template.items.length} items:
                </div>
                <div className="space-y-1 max-h-48 overflow-hidden">
                  {template.items.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-accent-success flex-shrink-0" />
                      <span className="truncate">
                        {item.name || item.title}
                      </span>
                    </div>
                  ))}
                  {template.items.length > 6 && (
                    <div className="text-xs text-foreground-muted pl-6">
                      +{template.items.length - 6} more items
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => applyTemplate(template)}
                disabled={applying === template.id}
                className="w-full py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {applying === template.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Apply Template
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-foreground-muted">
          <Palette size={48} className="mx-auto mb-4 opacity-50" />
          <p>No templates found for this category</p>
        </div>
      )}
    </div>
  )
}
