FitMate (VibeCode Hackathon)

Overview:
FitMate is an AI-powered fashion assistant that allows users to digitalize their wardrobe. Specifically, users can take images of pieces of clothes they own, upload it onto their FitMate account, and FitMate will categorize the clothes/tag it with style keywords, then store it into the user’s digital wardrobe. FitMate can then generate outfit recommendations based on user-input (key words/scenarios/requirements), displaying the pieces of clothes that would fit best together and match the user’s demands. 
The app uses the React framework and integrates Supabase (for authentication, storage, and database) with Gemini API to power the AI-based functionalities.

[IMPORTANT]
For testing purposes, please log in with the following account (wardrobe already supplied with testing data):
Email: test@gmail.com
Password: 123456

System Architecture:

Frontend Framework: React (Create React App)
Backend: Supabase (replacing Firebase)
●	Auth: User sign-in / sign-up via email and password
●	Database: Stores user profiles, wardrobe items, preferences, and outfit metadata
AI Engine: Outfit try-on and generation model (via Gemini API endpoint)
Deployment Mode: Development/production-ready with github-pages

Functional Tabs:

1. Wardrobe
●	Displays the user’s uploaded clothing items.
●	Pulls item metadata (name, category, upload date) from the Supabase closet table.
●	Shows thumbnails fetched directly from Supabase Storage.
●	Allows deletion of wardrobe items.
●	Functions correctly — tested with multiple entries and accounts
●	Performance: Loads images quickly; no blocking or infinite spinners observed.

2. Upload
●	Lets users upload new outfit photos (drag-and-drop or file selector)
●	Allows both single uploads and bulk uploads (upload many at once)
●	Files are converted to Base64 → sent to Supabase Storage under the user’s wardrobe folder.
●	Metadata (category, color, description) is added to Supabase Database.
●	Verified functionality — image appears in wardrobe within 1–2 seconds post-upload.

3. Get Outfit
●	Core AI feature.
●	Recommends a set of attire that fits well together AND best fulfills the user’s requirement (eg: “cold day”, “formal meeting”, “sports event” etc)
●	Performance: Takes ~3–5 seconds per request (dependent on model load); UI remains responsive with loading spinner.
●	When no wardrobe item closely matches the user’s requirements, the AI will notify that no items match, and will recommend pieces of clothes that will ideally match the requirements. 

4. Preferences
●	Stores user preferences (colors, styles, material types).
●	Updates are saved to the Supabase users table.
●	Influences the AI’s outfit recommendation and try-on suggestions.
●	Works as expected; preferences persist across sessions.

5. Closet Gaps
●	Analyses wardrobe data to find missing clothing categories (e.g., “no formal shoes”).
●	Suggests what users might want to purchase.
●	Uses the Supabase wardrobe table and simple category frequency analysis.
●	Functionality confirmed; executes within ~1 second.

6. Shop (UNFINISHED)
●	Redirects users to suggested partner sites or in-app recommendations (AI-driven).
●	Not directly connected to Supabase; relies on pre-set links or model outputs.
●	Functional navigation; expected behavior observed.

Performance Summary
  



Functionality Summary
 



Conclusion
FitMate performs smoothly for its hackathon-scale deployment:
●	All primary functions (upload, wardrobe, AI recommendation) are operational and performant.
●	The Supabase backend efficiently handles auth, data, and storage.
●	Navigation between tabs is immediate and intuitive.
●	Website is deployed publicly on github pages, accessible to everyone with internet. 


Further Improvements
FitMate could have bigger potential. To note a few upgrades/fixes we have in mind:
1.	“Remove Background” functionality (automatically removes the background of the uploaded images of the clothes) currently does not work
2.	Zip-file bulk upload currently have decompressing issues (will result in extra data), and so “single uploads” and “multiple uploads” are recommended.
3.	The AI Shop is not finished, and currently has bugs when the AI tries to recommend matching products based on user demands. When completed, we hope to make this shop into a Tinder-style shopping experience (user swipes left and right to like or dislike a certain style of clothes so that the AI learns what types of clothes the user prefers, and the user can also find the clothes they liked in their shopping cart).
4.	Email authentication could be implemented in the future to ensure that the email entered by the user is a valid, active email. 
5.	A paid version of Gemini would be required for large-scale distribution of the application. But it would be highly profitable if certain functionalities of this app could be designed to generate profit/activated from a paid membership. 
<img width="468" height="644" alt="image" src="https://github.com/user-attachments/assets/307e1ca0-a03d-46a7-873c-f2c688443b8e" />
