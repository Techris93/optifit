# OptiFit iOS App - Deployment Guide

## Prerequisites

- macOS (required for iOS development)
- Xcode 15+ (from Mac App Store)
- Apple Developer Account ($99/year)
- Node.js 18+
- CocoaPods (`sudo gem install cocoapods`)

## Initial Setup

### 1. Install Dependencies (on your Mac)

```bash
cd frontend
npm install
npm install -g @capacitor/cli
```

### 2. Build Web App

```bash
npm run build
```

### 3. Add iOS Platform

```bash
npx cap add ios
npx cap sync ios
```

### 4. Open in Xcode

```bash
npx cap open ios
```

## Xcode Configuration

### 1. Signing & Capabilities

1. In Xcode, select the project in the navigator
2. Select "OptiFit" target
3. Go to **Signing & Capabilities** tab
4. Set **Team** to your Apple Developer account
5. Update **Bundle Identifier**: `dev.techris93.optifit`

### 2. Required Permissions

Add to `ios/App/App/Info.plist`:

```xml
<!-- Camera permission -->
<key>NSCameraUsageDescription</key>
<string>OptiFit needs camera access to detect your gym equipment.</string>

<!-- Photo Library permission -->
<key>NSPhotoLibraryUsageDescription</key>
<string>OptiFit needs photo access to analyze your gym equipment.</string>

<!-- Photo Library Add permission -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>OptiFit can save workout photos to your library.</string>
```

### 3. App Icons

Replace placeholder icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 20pt (1x, 2x, 3x)
- 29pt (1x, 2x, 3x)
- 40pt (1x, 2x, 3x)
- 60pt (2x, 3x)
- 76pt (1x, 2x)
- 83.5pt (2x)
- 1024pt (1x - App Store)

Use [appicon.co](https://appicon.co) to generate from a single 1024x1024 image.

### 4. Launch Screen

Edit `ios/App/App/Base.lproj/LaunchScreen.storyboard` or use our custom one.

## Testing

### Simulator

```bash
npx cap run ios --target="iPhone 15 Pro"
```

### Physical Device

1. Connect iPhone via USB
2. In Xcode: Window → Devices and Simulators
3. Select your device
4. Click **Trust** on your iPhone when prompted
5. Build and run (Cmd+R)

## App Store Submission

### 1. App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill details:
   - **Name**: OptiFit
   - **Bundle ID**: dev.techris93.optifit
   - **SKU**: optifit-001
   - **Primary Language**: English

### 2. App Information

- **Subtitle**: AI Gym Equipment Workouts
- **Category**: Health & Fitness
- **Age Rating**: 4+

### 3. Screenshots

Required screenshots for:
- iPhone 6.7" (1290x2796) - iPhone 15 Pro Max
- iPhone 6.5" (1284x2778) - iPhone 14 Plus
- iPhone 5.5" (1242x2208) - iPhone 8 Plus
- iPad Pro 12.9" (2048x2732)

Use [screenshot-generator.com](https://screenshot-generator.com) or similar.

### 4. Build Archive

In Xcode:
1. Select **Any iOS Device (arm64)** as target
2. Product → Archive
3. Wait for build (5-10 min)
4. Click **Distribute App** → **App Store Connect** → **Upload**

### 5. Submit for Review

1. In App Store Connect, select your build
2. Fill:
   - **Promotional Text**: AI-powered workout planner using your gym equipment
   - **Description**: See below
   - **Keywords**: fitness, workout, gym, exercise, equipment, AI, training
   - **Support URL**: https://github.com/Techris93/optifit/issues
   - **Marketing URL**: https://github.com/Techris93/optifit

## App Store Description

```
OptiFit - AI Workout Planner

Turn photos of your gym equipment into personalized workout plans. 

FEATURES:
📸 Scan Your Equipment
Take photos or videos of your gym and our AI will identify all available equipment - barbells, dumbbells, kettlebells, resistance bands, and more.

🤖 Smart Workout Generation
Get custom workout plans based on your available equipment, fitness goals, and experience level. No more wondering what to do at the gym.

📚 Exercise Library
Browse 1000+ exercises with proper form instructions. Filter by muscle group, equipment, and difficulty.

📊 Track Progress
Log your workouts and track your strength gains over time.

💯 Free & Open Source
OptiFit is completely free with no ads. Our code is open source - you own your data.

HOW IT WORKS:
1. Open the app and scan your gym
2. Review detected equipment
3. Set your goals (strength, muscle building, endurance)
4. Get a personalized workout plan
5. Log your progress and improve

PRIVACY-FIRST:
- Works entirely offline if desired
- Your gym photos never leave your device
- No accounts required
- No tracking or analytics

Perfect for:
• Home gym owners
• Travelers using hotel gyms
• Beginners learning equipment
• Advanced athletes optimizing their training

Download OptiFit today and train smarter.
```

## Marketing Assets

### App Preview Video (Optional)

- 15-30 seconds
- Show: scan → detect → generate → workout
- Upload via App Store Connect

### Keywords (100 char max)

```
workout,gym,fitness,exercise,equipment,training,strength,muscle,personal trainer,workout planner
```

## Post-Launch

### Version Updates

1. Update version in `capacitor.config.json`
2. Update `ios/App/App.xcodeproj` version
3. Build and submit new archive

### Common Issues

**Issue**: "Unable to find certificate"
- Fix: Check Signing & Capabilities → Team selection

**Issue**: "Camera not working in simulator"
- Fix: Camera requires physical device, use gallery in simulator

**Issue**: "Build failed: duplicate symbols"
- Fix: Product → Clean Build Folder (Cmd+Shift+K)

## Fastlane Automation (Optional)

For automated deployments, add Fastlane:

```bash
cd ios
gem install fastlane
fastlane init
```

Create `fastlane/Fastfile` for automated builds.

---

**Estimated Timeline:**
- Initial setup: 1 day
- Testing: 2-3 days
- App Store review: 1-7 days
- **Total: 1-2 weeks to live**
