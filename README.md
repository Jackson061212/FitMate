# 👕 FitMate — Your AI-Powered College Wardrobe Assistant

**FitMate** is an AI-powered wardrobe and outfit recommender built for **college students** who want to look good without wasting time deciding what to wear.  
Upload your clothes, let AI organize your wardrobe, and get daily outfit ideas tailored to your **weather**, **occasion**, and **personal style**.

---

## 🎯 Core Value
> Students stop wasting time deciding what to wear.  
> They look good for every occasion — without buying new clothes all the time.

---

## 💡 Key Features

### 1. Smart Outfit Generator
Generates personalized outfit suggestions based on:
- 🌤 **Weather**
- 🎓 **Occasion** (class, gym, date, party, interview)
- 👔 **Dress code** preferences
- 🎨 **Colors** the user feels like wearing

---

## 🧩 Core Features (by Build Priority)

### [1] Firebase Backend
- Stores each user’s wardrobe, including uploaded pictures and tags.
- Supports authentication, cloud storage, and real-time database.

### [2] Outfit Recommendation Engine
- Uses AI prompts to generate daily outfit suggestions.
- Integrates with user wardrobe data, weather APIs, and preferences.

### [3] Background Remover
- Automatically removes the photo background on clothing upload.
- Keeps only the outfit for clean visual organization.

### [4] Closet Scanner
- Users upload clothes via photos.
- AI tags **color**, **type**, **season**, and **brand** — no manual sorting.
- Powered by **Gemini** for visual recognition.

### [5] Mass Upload Support 
- Upload multiple wardrobe photos at once.
- Automatically classifies all clothing items efficiently.

### [6] Body Type & Comfort Preferences 
- Personalized recommendations that match real comfort levels.
- Learns from user feedback and wardrobe data (e.g., avoids tight jeans if disliked).

### [7] Tinder-Style Swipe 
- Swipe right/left on outfits or pieces to teach the AI your aesthetic.
- Works with the recommendation engine to refine personal style over time.

### [8] Events Sync 
- Syncs with **campus events** (sports, fests, club meetings).
- Recommends outfits appropriate for each event automatically.

### [9] Closet Gaps Insight 
- AI identifies missing wardrobe pieces that could complete more outfit combinations.
- Suggests affordable additions through **affiliate links** (optional monetization).

### [10] Outfit History 
- Tracks previous outfits to help users avoid repeating looks.
- Displays “what you wore last week” to save from awkward outfit repeats.

---

## 💰 Monetization Model

**Freemium Approach**
- 🆓 **Free Tier:** Limited daily outfit suggestions.  
- 💎 **Premium Tier:** Unlimited suggestions, AI stylist chat, weather-based recommendations, and event sync.  
- 🔗 **Affiliate Model:** Earn commissions through recommended wardrobe additions.

---


## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Cursor IDE) |
| **Backend** | Node.js (Express) |
| **AI / ML APIs** | Gemini API, OpenAI Vision API |
| **Authentication** | Firebase Auth |
