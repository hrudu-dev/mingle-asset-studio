# 🧠 Mingle Asset Studio

**AI-Powered Creative Asset Generation for Adobe Express**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Adobe Express Add-on](https://img.shields.io/badge/Adobe%20Express-Add--on-purple)](https://developer.adobe.com/express/)

Mingle Asset Studio is a sophisticated Adobe Express add-on that revolutionizes how creators, designers, marketers, and teams generate custom assets using **multiple AI providers** including HuggingFace, Google Gemini, and Freepik—all seamlessly integrated within Adobe Express.

## 🎯 Key Features

### 🤖 **Multi-Provider AI Generation**
- **HuggingFace Integration**: Free tier using Pollinations AI + premium models
- **Google Gemini**: Advanced AI-powered image generation
- **Freepik API**: Ultra-realistic image generation
- **Intelligent Fallbacks**: Always works, regardless of API availability

### 🎨 **Smart Asset Creation**
- **6 Style Modes**: Cyberpunk, Minimalist, Colorful, Real, Corporate, Artistic
- **Multiple Asset Types**: Images, Icons, Layouts, Logos
- **Aspect Ratio Support**: 1:1, 9:16, 16:9 with automatic optimization
- **Batch Generation**: Creates 4 variations simultaneously

### 📁 **Integrated Asset Management**
- **Real-time Output Gallery**: Generated assets immediately available
- **One-Click Integration**: Direct insertion into Adobe Express documents
- **Persistent Storage**: Assets saved across sessions
- **Quality Control**: Built-in error handling and fallback generation

## 🚀 Quick Start

### Prerequisites
- **Adobe Express** account with add-on support
- **Node.js** 14+ for development
- **Modern web browser**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hrudu-dev/mingle-asset-studio.git
   cd mingle-asset-studio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Load in Adobe Express**:
   - Open Adobe Express
   - Navigate to Add-ons → Developer Mode
   - Load manifest from `src/manifest.json`

### First Asset Generation

1. **Enter a prompt**: "Modern tech logo with blue gradient"
2. **Select provider**: HuggingFace (default), Gemini, or Freepik
3. **Choose style**: Minimalist for clean designs
4. **Generate**: Click "✨ Generate" for 4 AI variations
5. **Add to document**: Click any generated asset to insert

## 🔧 Configuration

### API Setup (Optional)

The app works out-of-the-box with free services, but you can add API keys for enhanced functionality:

#### HuggingFace API (Recommended)
```javascript
// In src/ui/index.js, replace:
getHuggingFaceApiKey() {
    return 'YOUR_HUGGINGFACE_API_KEY_HERE'; // Get from https://huggingface.co/settings/tokens
}
```

#### Google Gemini API
```javascript
// In src/ui/index.js, replace:
getGeminiApiKey() {
    return 'YOUR_GEMINI_API_KEY_HERE'; // Get from https://aistudio.google.com/app/apikey
}
```

#### Freepik API
```javascript
// In src/ui/index.js, replace:
getFreepikApiKey() {
    return 'YOUR_FREEPIK_API_KEY_HERE'; // Get from https://freepik.com/api
}
```

> **Note**: The app includes free AI generation using Pollinations AI, so API keys are optional for basic functionality.

## 🏗️ Architecture

### Project Structure
```
mingle-asset-studio/
├── src/
│   ├── index.html              # Main UI interface
│   ├── manifest.json           # Adobe Express add-on config
│   ├── ui/
│   │   ├── index.js           # Main application controller
│   │   ├── huggingface-service.js  # HF API integration
│   │   ├── gemini-service.js      # Gemini API integration
│   │   ├── freepik-service.js     # Freepik API integration
│   │   ├── local-models-service.js # Free AI service
│   │   └── styles.css         # UI styling
│   └── sandbox/
│       └── code.js            # Adobe Express integration
├── docs/                      # Documentation
├── ABOUT.md                   # Detailed project overview
└── API_SETUP_GUIDE.md        # API configuration guide
```

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Adobe Integration**: Adobe Express Add-on SDK
- **AI Services**: HuggingFace, Google Gemini, Freepik APIs
- **Development**: Node.js, NPM, Hot-reloading server

## 🎨 Usage Examples

### Generating Marketing Assets
```javascript
const marketingAsset = {
    prompt: "Professional banner for sustainable energy company",
    style: "corporate",
    type: "image",
    aspectRatio: "16:9"
};
```

### Creating Logo Variations
```javascript
const logoVariations = {
    prompt: "Minimalist logo for AI startup, tech-focused",
    style: "minimalist", 
    type: "logo",
    aspectRatio: "1:1"
};
```

### Social Media Content
```javascript
const socialContent = {
    prompt: "Eye-catching product photo for Instagram",
    style: "colorful",
    type: "image", 
    aspectRatio: "1:1"
};
```

## �️ Development

### Building for Production
```bash
# Build optimized version
npm run build

# Test the build
npm run preview
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📋 Roadmap

### ✅ Current Features
- [x] Multi-provider AI generation (HuggingFace, Gemini, Freepik)
- [x] Free tier with Pollinations AI
- [x] Real-time asset management
- [x] Adobe Express integration
- [x] Style-aware generation
- [x] Batch asset creation
- [x] Error handling and fallbacks

### 🚧 In Development
- [ ] Enhanced prompt optimization
- [ ] Custom model training
- [ ] Team collaboration features
- [ ] Advanced brand kit integration

### 📅 Planned
- [ ] Mobile app version
- [ ] Figma plugin
- [ ] API service for developers
- [ ] Real-time collaboration

## 📞 Support & Community

- **🐛 Issues**: [GitHub Issues](https://github.com/hrudu-dev/mingle-asset-studio/issues)
- **📖 Documentation**: [Comprehensive Guides](./docs/)
- **💬 Discussions**: [GitHub Discussions](https://github.com/hrudu-dev/mingle-asset-studio/discussions)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Hrudu Shibu** - [GitHub](https://github.com/hrudu-dev)

---

**🎨 Transforming creative workflows with AI-powered asset generation**

*Built with ❤️ for the Adobe Express ecosystem*
