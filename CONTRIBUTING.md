# Contributing to Mingle Asset Studio

Thank you for considering contributing to Mingle Asset Studio! We welcome contributions from developers of all skill levels.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mingle-asset-studio.git
   cd mingle-asset-studio
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm start
   ```

## 📋 Development Guidelines

### Code Style
- Use **modern JavaScript (ES6+)** features
- Follow **consistent indentation** (2 spaces)
- Add **clear comments** for complex logic
- Use **descriptive variable names**

### Commit Messages
Follow the convention:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests

Example: `feat: add Gemini API integration for image generation`

### Branch Naming
- `feature/feature-name` for new features
- `fix/bug-description` for bug fixes
- `docs/documentation-update` for documentation

## 🐛 Reporting Issues

When reporting issues, please include:
- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Browser and Adobe Express version**

## 💡 Feature Requests

We welcome feature requests! Please:
- **Check existing issues** first
- **Describe the use case** clearly
- **Explain the benefits** to users
- **Provide mockups** if possible

## 🧪 Testing

Before submitting a PR:
- Test your changes in **Adobe Express**
- Verify **all AI providers** still work
- Check **console for errors**
- Test on different **screen sizes**

## 📝 Documentation

When adding features:
- Update **README.md** if needed
- Add **code comments** for complex logic
- Update **API_SETUP_GUIDE.md** for new integrations
- Include **usage examples**

## 🤝 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear commits
3. **Test thoroughly** in Adobe Express
4. **Update documentation** as needed
5. **Submit a pull request** with:
   - Clear description of changes
   - Screenshots/videos if UI changes
   - Reference to related issues

## 🔧 Development Setup

### Environment Variables
Copy `.env.example` to `.env.local` and add your API keys (optional):
```bash
cp .env.example .env.local
```

### Adobe Express Testing
1. Load the add-on in Adobe Express developer mode
2. Use the manifest from `src/manifest.json`
3. Test all functionality before submitting

## 📞 Getting Help

- **GitHub Discussions**: For questions and community help
- **GitHub Issues**: For bugs and feature requests
- **Email**: Contact the maintainer for urgent issues

## 🎉 Recognition

Contributors will be:
- **Listed in the contributors section**
- **Credited in release notes**
- **Mentioned in project documentation**

Thank you for helping make Mingle Asset Studio better! 🚀
