# 🖼️ BG Remover Pro

A powerful, **100% client-side** background removal tool. All processing happens in your browser - no server uploads, completely free and private.

---

## 📺 Video Tutorial

<img width="400" alt="Results" src="https://github.com/user-attachments/assets/61cf8e63-9d1f-4459-b5ab-b7e6e87228b6" />

---

## � Screenshots

### Main Interface
<img width="400" alt="Main Interface" src="https://github.com/user-attachments/assets/f9a6da65-e88a-4d72-8419-361e7d7ab919" />

### Processing Mode
<img width="400" alt="Processing Mode" src="https://github.com/user-attachments/assets/a6c43a31-463a-4fad-9768-d69c9db680b0" />


---

## 🎯 How It Works

### Simple 3-Step Workflow

```
1️⃣ UPLOAD     →     2️⃣ CHOOSE MODE     →     3️⃣ DOWNLOAD
   Drop images         Select processing         Get results instantly
```

### Processing Modes

| Mode | Description | Output |
|------|-------------|--------|
| ✂️ **Remove Background (AI)** | Intelligent AI-powered background removal | Transparent PNG |
| 🎨 **Remove Color (Chroma Key)** | Remove specific color (like green screen) | Transparent PNG |
| 🌫️ **Blur Background** | Keep subject sharp, blur background | JPEG with bokeh effect |

---

## ✨ Key Features

- 🔒 **100% Private** - No server uploads, everything runs in your browser
- ⚡ **Live Preview** - See results before downloading
- 📦 **Batch Processing** - Process multiple images at once
- 📋 **History** - Re-download previous results anytime
- 📱 **Mobile Ready** - Works on any device

---

## 🚀 Quick Start

```bash
# Install
npm install

# Run
npm run dev

# Open
http://localhost:3000
```

---

## 🎨 Chroma Key (Remove Color)

Perfect for:
- 🟩 Green screen removal
- 🟦 Blue screen removal
- ⬜ White background removal
- Any solid color removal

**Tolerance slider** - Adjust to remove similar shades of the target color.

---

## 📁 Project Structure

```
src/
├── app/page.tsx              # Main page
├── components/
│   ├── UploadZone.tsx        # Drag & drop upload
│   ├── ModeSelectionModal.tsx # Mode picker + preview
│   └── QueueGrid.tsx         # Image grid
├── lib/
│   ├── imageProcessing.ts    # Core processing functions
│   └── db.ts                 # IndexedDB storage
└── contexts/
    └── QueueContext.tsx      # State management
```

---

## 🛠️ Technologies

- **Next.js 14** - React framework
- **@imgly/background-removal** - AI background removal
- **IndexedDB** - Local storage
- **Tailwind CSS** - Styling

---

## 🌐 Deploy

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Works on any static hosting (Netlify, Cloudflare Pages, etc.)

---

## 📄 License

MIT - Free for personal and commercial use.
