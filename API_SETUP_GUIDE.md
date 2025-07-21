# API Setup Guide for Mingle Asset Studio

This guide will help you configure the API connections for all supported AI image generation services.

## 🚨 Current Issues Found

**❌ CRITICAL: HuggingFace API Key Invalid**
- The current API key in the code is not working
- Error: "Invalid credentials in Authorization header"
- **Action Required**: Get a new valid API key

**❌ Gemini API Not Configured**
- Using placeholder API key
- **Action Required**: Configure with valid Google AI Studio key

**✅ Freepik API**: Appears to be configured

---

## 🤗 Hugging Face API Setup (PRIORITY)

### Current Status
⚠️ **API KEY VALID BUT REQUIRES PAYMENT** - HuggingFace Inference API needs credits

### ISSUE IDENTIFIED:
Your API key `[YOUR_HF_API_KEY]` should be **valid** but:
- ✅ Can access HuggingFace models and data
- ❌ **Cannot generate images** - returns "402 Payment Required"
- 💳 **Inference API requires paid credits**

### IMMEDIATE STEPS TO FIX:

**Option 1: Add Payment to HuggingFace (Recommended)**
1. Go to [https://huggingface.co/pricing](https://huggingface.co/pricing)
2. Add credits to your account (starts at $9/month)
3. Your current API key will then work for image generation

**Option 2: Use Free Alternatives**
1. Keep current setup - app will use Freepik API instead
2. HuggingFace will show fallback placeholder images
3. No additional cost, but limited to other providers

### Why it's failing:
- **Error**: "402 Payment Required" 
- **Cause**: HuggingFace Inference API requires paid subscription for image generation
- **Models affected**: All Stable Diffusion and image generation models
- **API access**: ✅ Working for model info, ❌ Failing for generation

---

## 🚨 UPDATED STATUS

**✅ HuggingFace API**: Valid key but requires payment for image generation
**❌ Gemini API**: Not configured 
**✅ Freepik API**: Appears configured and should work

---

## 🧠 Google Gemini API Setup

### Current Status
❌ **Not Configured** - Using placeholder API key

### Steps to configure:
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with 'AIza')
4. Replace in `src/ui/index.js`:
   ```javascript
   getGeminiApiKey() {
       const apiKey = 'AIzaSyD...your_actual_key_here'; // Your real API key
       return apiKey;
   }
   ```

---

## ⭐ Freepik API Setup

### Current Status
✅ **Configured** - API key is set

### To verify/update:
1. Go to [https://freepik.com/api](https://freepik.com/api)
2. Check your API key status
3. If needed, update in `src/ui/index.js`:
   ```javascript
   getFreepikApiKey() {
       const apiKey = 'YOUR_FREEPIK_KEY'; // Replace if needed
       return apiKey;
   }
   ```

---

## 🔧 Troubleshooting

### Quick Diagnosis
1. Click "🔧 Diagnose All" button in the app
2. Check browser console for detailed errors
3. Look for specific error messages

### Common Error Messages

#### "Invalid credentials in Authorization header"
- **Problem**: HuggingFace API key is invalid/expired
- **Solution**: Get new API key from HuggingFace

#### "API key not configured"
- **Problem**: Using placeholder API key
- **Solution**: Replace with real API key

#### "CORS error"
- **Problem**: Browser security restriction
- **Solution**: This is normal in development, will work in Adobe Express

#### "Model is loading"
- **Problem**: HuggingFace model needs warm-up time
- **Solution**: Wait 10-20 seconds and try again

### Testing Steps
1. **HuggingFace**: Click "🧪 HF" - should show user verification
2. **Gemini**: Click "🧪 Gemini" - should connect if key is valid
3. **Freepik**: Click "🧪 Freepik" - should show API status

---

## 💡 PRIORITY ACTIONS

### Step 1: Fix HuggingFace (URGENT)
```
1. Get new HF API key → https://huggingface.co/settings/tokens
2. Replace in getHuggingFaceApiKey() method
3. Test with 🧪 HF button
```

### Step 2: Configure Gemini (Optional)
```
1. Get Google AI Studio key → https://aistudio.google.com/app/apikey
2. Replace in getGeminiApiKey() method  
3. Test with 🧪 Gemini button
```

### Step 3: Verify Freepik (Check)
```
1. Test with 🧪 Freepik button
2. Should work if key is valid
```

---

## ✅ Success Indicators

- **Green toast messages**: "✅ API connection verified"
- **Console logs**: "✅ Hugging Face API connection successful!"
- **Working generation**: Images generate without "fallback" warnings

## ❌ Failure Indicators

- **Red toast messages**: "❌ API connection failed"
- **Console errors**: "Invalid credentials" or similar
- **Fallback warnings**: Using placeholder images instead of AI generation

---

**NEXT STEP**: Get a valid HuggingFace API key and replace it in the code!
