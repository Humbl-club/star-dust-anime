# Contributing to Anime & Manga Discovery Platform

Thank you for your interest in contributing! This guide will help you get started with contributing to our project.

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** first to avoid duplicates
2. **Use issue templates** when available
3. **Provide clear descriptions** with steps to reproduce
4. **Include relevant details** (browser, OS, screenshots)

### Suggesting Features

1. **Check roadmap** and existing feature requests
2. **Open a discussion** for major features
3. **Provide use cases** and rationale
4. **Consider implementation complexity**

## 🚀 Development Process

### Setting Up

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/anime-manga-platform.git
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow naming conventions**
   - `feature/` for new features
   - `fix/` for bug fixes
   - `docs/` for documentation
   - `refactor/` for code improvements

3. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run lint        # Check code style
   npm run type-check  # Verify TypeScript
   npm run build       # Test production build
   ```

### Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add anime recommendation engine
fix: resolve search filter bug
docs: update API documentation
style: format code with prettier
refactor: improve performance of content grid
test: add unit tests for search component
```

### Code Style

- **TypeScript**: Use strict typing
- **ESLint**: Follow configured rules
- **Prettier**: Automatic formatting on commit
- **Components**: PascalCase naming
- **Functions**: camelCase naming
- **Files**: kebab-case for utilities, PascalCase for components

### Testing Requirements

- **Unit Tests**: Add tests for new functions/hooks
- **Component Tests**: Test user interactions
- **Storybook**: Document new components
- **Type Safety**: Ensure TypeScript compliance

## 📝 Pull Request Process

### Before Submitting

1. **Sync with main branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature
   git rebase main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

3. **Update documentation** if needed

### Submitting PR

1. **Create pull request** to `main` branch
2. **Use PR template** and fill out all sections
3. **Link related issues** using keywords
4. **Request reviews** from maintainers

### PR Guidelines

- **Small, focused changes** are preferred
- **Clear descriptions** of what and why
- **Include screenshots** for UI changes
- **Update tests** and documentation
- **Respond to feedback** promptly

## 🎨 Design Guidelines

### UI/UX Principles

- **Mobile-first** responsive design
- **Accessibility** compliance (WCAG 2.1)
- **Performance** - optimize for speed
- **Consistency** with design system

### Component Development

1. **Start with Storybook** stories
2. **Use semantic HTML** elements
3. **Implement keyboard navigation**
4. **Add proper ARIA labels**
5. **Test across devices/browsers**

### Style Guidelines

- **Use design tokens** from CSS variables
- **Follow Tailwind utility classes**
- **Avoid custom CSS** when possible
- **Responsive breakpoints** for all components

## 🔧 Technical Standards

### Code Quality

- **TypeScript strict mode** enabled
- **ESLint configuration** enforced
- **Prettier formatting** automated
- **Pre-commit hooks** prevent bad commits

### Performance

- **Bundle size** monitoring
- **Lazy loading** for routes and components
- **Image optimization** for all assets
- **Virtual scrolling** for large lists

### Security

- **Input validation** on all forms
- **XSS prevention** in dynamic content
- **Secure API calls** with proper headers
- **Environment variable** protection

## 📚 Documentation Standards

### Code Documentation

- **JSDoc comments** for complex functions
- **README updates** for new features
- **Storybook stories** for all components
- **Type definitions** with descriptions

### Commit Documentation

- **Clear commit messages** following conventions
- **PR descriptions** explaining changes
- **Issue linking** for traceability
- **Breaking change** notifications

## 🧪 Testing Guidelines

### Test Coverage

- **Unit tests** for utilities and hooks
- **Integration tests** for components
- **E2E tests** for critical user flows
- **Visual regression** testing with Storybook

### Testing Best Practices

- **Test behavior, not implementation**
- **Use Testing Library** queries appropriately
- **Mock external dependencies**
- **Write descriptive test names**

## 🚦 Review Process

### Automated Checks

- **CI/CD pipeline** runs on all PRs
- **TypeScript compilation**
- **Linting and formatting**
- **Test execution**
- **Build verification**

### Manual Review

- **Code quality** assessment
- **Design review** for UI changes
- **Performance impact** evaluation
- **Security considerations**

### Approval Process

1. **Automated checks** must pass
2. **At least one reviewer** approval required
3. **No unresolved conversations**
4. **Up-to-date with main** branch

## 🏆 Recognition

### Contributors

- **All contributors** listed in README
- **Significant contributions** highlighted
- **First-time contributors** welcomed
- **Regular contributors** may become maintainers

### Types of Contributions

- **Code contributions** (features, fixes)
- **Documentation** improvements
- **Issue reporting** and triage
- **Community support** and discussions
- **Design** and UX improvements

## 📞 Getting Help

### Communication Channels

- **GitHub Issues** for bugs and features
- **GitHub Discussions** for questions
- **Code reviews** for technical guidance
- **Documentation** for implementation details

### Mentorship

- **New contributors** paired with experienced developers
- **Code review feedback** as learning opportunity
- **Pairing sessions** for complex features
- **Architecture discussions** for major changes

## 📋 Checklist Template

### Before Opening PR

- [ ] Code follows style guidelines
- [ ] Tests added/updated for changes
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Accessibility checked
- [ ] Performance impact considered
- [ ] Cross-browser testing done

### PR Description

- [ ] Clear title describing the change
- [ ] Description explains what and why
- [ ] Related issues linked
- [ ] Screenshots for UI changes
- [ ] Breaking changes noted
- [ ] Migration guide provided if needed

---

Thank you for contributing to our project! Your efforts help make this platform better for everyone. 🎉