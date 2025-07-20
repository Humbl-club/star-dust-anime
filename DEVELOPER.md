# Anime & Manga Discovery Platform - Developer Guide

A modern React application for discovering anime and manga content, built with TypeScript, React, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anime-manga-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/          # UI Components
│   ├── common/         # Shared utility components
│   │   ├── FeatureWrapper.tsx
│   │   ├── InitializationWrapper.tsx
│   │   └── LazyComponents.tsx
│   ├── features/       # Feature-specific components  
│   │   ├── AddToListButton.tsx
│   │   ├── AnimeCard.tsx
│   │   ├── ContentGrid.tsx
│   │   └── AdvancedFiltering.tsx
│   ├── layouts/        # Layout and navigation
│   │   ├── DetailPageLayout.tsx
│   │   └── VirtualizedContentGrid.tsx
│   └── ui/            # Base UI components (shadcn/ui)
├── hooks/             # Custom React hooks
├── services/          # API services and data fetching
├── store/            # State management (Zustand)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── pages/            # Route components
└── styles/           # Global styles
```

## 🛠️ Development Tools

### Code Quality

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking

# Documentation
npm run storybook        # Start Storybook
npm run build-storybook  # Build Storybook

# Analysis
npm run analyze          # Bundle size analysis
```

## 🏗️ Architecture Overview

### Frontend Architecture

- **React 18**: Modern React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Query**: Server state management

### Backend Integration

- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)

### State Management

- **Zustand**: Lightweight state management
- **React Query**: Server state caching
- **Local Storage**: Persistence for user preferences

### Performance Optimizations

- **Code Splitting**: Lazy loading with React.lazy()
- **Bundle Analysis**: Webpack bundle analyzer
- **Image Optimization**: Responsive images
- **Virtual Scrolling**: Efficient list rendering

## 🎨 Design System

### Theming

- **CSS Variables**: Semantic color tokens
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Mobile-first approach

### Component Library

- **shadcn/ui**: Base component library
- **Custom Components**: Feature-specific components
- **Storybook**: Component documentation

## 🔧 Development Workflow

### Git Workflow

1. **Feature Branch**: Create from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development**: Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Pre-commit Hooks**: Automatically run:
   - ESLint with auto-fix
   - Prettier formatting
   - TypeScript type checking

4. **Pre-push Hooks**: Automatically run:
   - Full linting
   - Type checking
   - Production build test

### Code Style Guidelines

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code standards
- **Prettier**: Consistent formatting
- **Naming**: PascalCase for components, camelCase for functions

### Component Development

1. **Create Component**: Use TypeScript interfaces
2. **Add Stories**: Document in Storybook
3. **Write Tests**: Unit tests with Jest
4. **Update Types**: Export types from component

## 🧪 Testing Strategy

### Unit Testing
- **Vitest**: Modern test runner
- **Testing Library**: Component testing
- **MSW**: API mocking

### E2E Testing
- **Playwright**: End-to-end testing
- **Visual Regression**: Screenshot testing

## 📦 Dependencies

### Core Dependencies
- `react`: ^18.3.1
- `typescript`: ^5.2.2
- `vite`: ^5.1.0
- `@supabase/supabase-js`: ^2.50.3
- `@tanstack/react-query`: ^5.83.0

### Development Dependencies
- `eslint`: ^8.57.0
- `prettier`: ^3.2.5
- `husky`: ^9.0.11
- `@storybook/react-vite`: ^7.6.17

## 🚀 Deployment

### Environment Variables

Required for production:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Process

```bash
npm run build           # Create production build
npm run preview         # Test production build locally
```

### Platform Deployment

- **Lovable**: One-click deployment
- **Vercel**: Connect GitHub repository
- **Netlify**: Drag & drop deployment

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Pull Request Guidelines

- **Clear Description**: Explain what and why
- **Small Commits**: Focused, atomic changes
- **Tests**: Add tests for new features
- **Documentation**: Update docs if needed

### Code Review Process

1. **Automated Checks**: CI/CD pipeline
2. **Manual Review**: Team member review
3. **Testing**: Feature testing
4. **Merge**: Squash and merge

## 📚 Documentation

### Storybook

- **Component Docs**: Visual component library
- **Interactive Examples**: Live component testing
- **Design System**: Style guide and tokens

### API Documentation

- **Supabase Schema**: Database structure
- **Service Layer**: API abstractions
- **Type Definitions**: TypeScript interfaces

## 🐛 Debugging

### Development Tools

- **React DevTools**: Component debugging
- **React Query DevTools**: State inspection
- **Supabase Dashboard**: Database queries

### Common Issues

1. **Build Errors**: Check TypeScript types
2. **Style Issues**: Verify Tailwind classes
3. **API Errors**: Check Supabase configuration

## 📈 Performance Monitoring

### Metrics

- **Bundle Size**: Track with analyzer
- **Load Times**: Lighthouse audits
- **Runtime Performance**: React Profiler

### Optimization Techniques

- **Code Splitting**: Lazy load components
- **Memoization**: React.memo and useMemo
- **Virtual Scrolling**: Large list performance

## 🔐 Security

### Best Practices

- **Environment Variables**: Never commit secrets
- **RLS Policies**: Database security
- **Input Validation**: Client and server side
- **Authentication**: Secure user management

## 🆘 Support

### Getting Help

- **Documentation**: Check this README first
- **Issues**: Create GitHub issue
- **Discussions**: Team discussions
- **Code Review**: Ask for help in PRs

### Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Storybook Documentation](https://storybook.js.org/docs)

---

**Happy coding! 🎉**