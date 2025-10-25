import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, User, LogOut, Trash2, ShoppingBag, Loader2, Home, FolderOpen, Archive, CheckCircle, Settings, Calendar } from 'lucide-react';
import JSZip from 'jszip';
import EventPlanner from './EventPlanner';

// API Key
const GEMINI_API_KEY = 'AlzaSyACMmigNUz9JTuunnelqtUrNMbPHzmkaPw';

// ============= API SCHEMAS =============
const clothingAnalysisSchema = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING" },
    color: { type: "STRING" },
    material: { type: "STRING" },
    style: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    fullDescription: { type: "STRING" }
  },
  propertyOrdering: ["type", "color", "material", "style", "fullDescription"]
};

const outfitRecommendationSchema = {
  type: "OBJECT",
  properties: {
    selectedItems: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    styleNote: { type: "STRING" }
  },
  propertyOrdering: ["selectedItems", "styleNote"]
};

// ============= API FUNCTIONS =============
const fetchStructuredContent = async (userQuery, systemPrompt, responseSchema) => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  };

  const attemptFetch = async (retries = 3) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonString) {
        throw new Error("API response was missing expected JSON content.");
      }

      return JSON.parse(jsonString);

    } catch (error) {
      if (retries > 0 && error.message.includes('429')) {
        console.warn(`Rate limit hit, retrying in ${4 - retries} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
        return attemptFetch(retries - 1);
      }
      throw error;
    }
  };

  return attemptFetch();
};

const analyzeClothingWithGemini = async (imageBase64, mimeType = 'image/jpeg') => {
  const userQuery = `Analyze this clothing item image and provide detailed information about it.`;

  const systemPrompt = `You are an expert fashion analyst. Analyze the clothing item in the image and provide:
- type: The specific type of clothing (e.g., "T-shirt", "Jeans", "Sneakers", "Dress")
- color: The primary color of the item
- material: The apparent material (e.g., "Cotton", "Denim", "Leather", "Wool", "Polyester")
- style: An array of 2-4 style tags (e.g., ["casual", "streetwear"], ["formal", "business"], ["sporty", "athletic"])
- fullDescription: A detailed 2-3 sentence description including design elements, patterns, fit, and notable features

Be specific and accurate. Return ONLY valid JSON matching the schema.`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        { text: userQuery },
        {
          inline_data: {
            mime_type: mimeType,
            data: imageBase64
          }
        }
      ]
    }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: clothingAnalysisSchema
    }
  };

  const attemptFetch = async (retries = 3) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonString) {
        throw new Error("API response was missing expected JSON content.");
      }

      return JSON.parse(jsonString);

    } catch (error) {
      if (retries > 0 && error.message.includes('429')) {
        console.warn(`Rate limit hit, retrying in ${4 - retries} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
        return attemptFetch(retries - 1);
      }
      throw error;
    }
  };

  return attemptFetch();
};

const generateOutfitWithGemini = async (clothingItems, occasion, userPreferences = {}) => {
  const wardrobeDescription = clothingItems.map((item, index) => ({
    id: item.id,
    index: index,
    type: item.aiDescription.type,
    color: item.aiDescription.color,
    material: item.aiDescription.material,
    style: item.aiDescription.style,
    fullDescription: item.aiDescription.fullDescription
  }));

  const preferencesText = userPreferences ? `
User Preferences:
- Body Type: ${userPreferences.bodyType || 'Not specified'}
- Comfort Preferences: ${userPreferences.comfortPreferences?.join(', ') || 'None specified'}
- Style Preferences: ${userPreferences.stylePreferences?.join(', ') || 'None specified'}
- Dislikes: ${userPreferences.dislikes?.join(', ') || 'None specified'}
- Shoe Preferences: ${userPreferences.shoePreferences || 'Not specified'}
- Fit Preferences: ${userPreferences.fitPreferences || 'Not specified'}
` : '';

  const userQuery = `Create an outfit recommendation for this occasion: ${occasion}

Available wardrobe items:
${JSON.stringify(wardrobeDescription, null, 2)}
${preferencesText}`;

  const systemPrompt = `You are a professional fashion stylist. Based on the user's wardrobe, preferences, and the specified occasion, recommend a complete outfit of 3-4 items.

Instructions:
1. Select items that are appropriate for the occasion
2. Ensure the colors complement each other
3. Match style and formality levels
4. Create a cohesive, fashionable look
5. IMPORTANT: Respect the user's preferences and avoid items they dislike
6. Consider their comfort preferences (e.g., avoid tight items if they prefer loose fits)
7. Match their style preferences when possible
8. Consider their shoe preferences for footwear selection
9. Respect their fit preferences (loose, fitted, etc.)

Return:
- selectedItems: Array of item IDs (strings) that form the outfit
- styleNote: A brief 2-3 sentence explanation of why this outfit works for the occasion and how it respects their preferences

Return ONLY valid JSON matching the schema.`;

  return fetchStructuredContent(userQuery, systemPrompt, outfitRecommendationSchema);
};

// ============= MAIN APP =============
export default function FitMate() {
  const [currentView, setCurrentView] = useState('home');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);

  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // User preferences state
  const [userPreferences, setUserPreferences] = useState({
    bodyType: '',
    comfortPreferences: [],
    stylePreferences: [],
    dislikes: [],
    shoePreferences: '',
    fitPreferences: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Bulk upload states
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'bulk'

  const [occasion, setOccasion] = useState('');
  const [recommendedOutfit, setRecommendedOutfit] = useState(null);

  useEffect(() => {
    const savedUsers = localStorage.getItem('fitmate_users');
    const savedWardrobe = localStorage.getItem('fitmate_wardrobe');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedWardrobe) setWardrobe(JSON.parse(savedWardrobe));
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem('fitmate_users', JSON.stringify(newUsers));
  };

  const saveWardrobe = (newWardrobe) => {
    setWardrobe(newWardrobe);
    localStorage.setItem('fitmate_wardrobe', JSON.stringify(newWardrobe));
  };

  const handleSignUp = () => {
    setError('');

    if (!authForm.name || !authForm.email || !authForm.password) {
      setError('All fields are required');
      return;
    }

    if (authForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (users.find(u => u.email === authForm.email)) {
      setError('User already exists');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
      preferences: {
        bodyType: '',
        comfortPreferences: [],
        stylePreferences: [],
        dislikes: [],
        shoePreferences: '',
        fitPreferences: ''
      }
    };

    saveUsers([...users, newUser]);
    setCurrentUser(newUser);
    setAuthForm({ email: '', password: '', name: '' });
    setCurrentView('wardrobe');
    setSuccess('Account created successfully!');
  };

  const handleSignIn = () => {
    setError('');

    const user = users.find(
        u => u.email === authForm.email && u.password === authForm.password
    );

    if (!user) {
      setError('Invalid credentials');
      return;
    }

    setCurrentUser(user);
    setAuthForm({ email: '', password: '', name: '' });
    setCurrentView('wardrobe');
    setSuccess('Welcome back!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setRecommendedOutfit(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setSuccess('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Check for supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(selectedFile.type.toLowerCase())) {
      setError('Please select a JPEG, PNG, or WebP image file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select an image smaller than 10MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          console.log('Image details:', {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            base64Length: base64.length
          });
          
          const aiDescription = await analyzeClothingWithGemini(base64, selectedFile.type);

          const newItem = {
            id: Date.now().toString(),
            userId: currentUser.id,
            imageUrl: reader.result,
            aiDescription,
            createdAt: new Date().toISOString()
          };

          saveWardrobe([...wardrobe, newItem]);
          setSuccess('Item uploaded and analyzed successfully!');
          setSelectedFile(null);
          setPreview(null);
          setLoading(false);

          setTimeout(() => {
            setCurrentView('wardrobe');
            setSuccess('');
          }, 2000);
        } catch (err) {
          console.error('Upload error:', err);
          setError(`Failed to analyze image: ${err.message}. Please try a different image or check if the image format is supported.`);
          setLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError('Failed to process image');
      setLoading(false);
    }
  };

  // Bulk upload functions
  const handleBulkFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    setBulkFiles(imageFiles);
    setError('');
    
    // Create previews for all images
    const previews = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews[i] = reader.result;
        if (previews.length === imageFiles.length) {
          setBulkPreview([...previews]);
        }
      };
      reader.readAsDataURL(imageFiles[i]);
    }
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file');
      return;
    }

    setBulkLoading(true);
    setError('');

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const imageFiles = [];
      const imagePromises = [];

      // Extract images from zip
      for (const [filename, zipFile] of Object.entries(zipContent.files)) {
        if (!zipFile.dir && filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          imagePromises.push(
            zipFile.async('blob').then(blob => {
              const file = new File([blob], filename, { type: blob.type });
              imageFiles.push(file);
            })
          );
        }
      }

      await Promise.all(imagePromises);
      
      if (imageFiles.length === 0) {
        setError('No image files found in the ZIP archive');
        setBulkLoading(false);
        return;
      }

      setBulkFiles(imageFiles);
      
      // Create previews
      const previews = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[i] = reader.result;
          if (previews.filter(p => p).length === imageFiles.length) {
            setBulkPreview([...previews]);
          }
        };
        reader.readAsDataURL(imageFiles[i]);
      }
      
      setBulkLoading(false);
      setSuccess(`Successfully extracted ${imageFiles.length} images from ZIP file`);
    } catch (err) {
      setError('Failed to process ZIP file: ' + err.message);
      setBulkLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setBulkLoading(true);
    setError('');
    setUploadProgress({ current: 0, total: bulkFiles.length });

    const newItems = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      try {
        setUploadProgress({ current: i + 1, total: bulkFiles.length });
        
        const reader = new FileReader();
        const result = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(bulkFiles[i]);
        });

        const base64 = result.split(',')[1];
        const aiDescription = await analyzeClothingWithGemini(base64);

        const newItem = {
          id: `${Date.now()}_${i}`,
          userId: currentUser.id,
          imageUrl: result,
          aiDescription,
          createdAt: new Date().toISOString()
        };

        newItems.push(newItem);
        successCount++;
      } catch (err) {
        console.error(`Failed to process ${bulkFiles[i].name}:`, err);
        errorCount++;
      }
    }

    if (newItems.length > 0) {
      saveWardrobe([...wardrobe, ...newItems]);
    }

    setBulkLoading(false);
    setBulkFiles([]);
    setBulkPreview([]);
    setUploadProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      setSuccess(`Successfully uploaded ${successCount} items${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      setTimeout(() => {
        setCurrentView('wardrobe');
        setSuccess('');
      }, 3000);
    } else {
      setError('Failed to upload any items');
    }
  };

  const handleDeleteItem = (itemId) => {
    saveWardrobe(wardrobe.filter(item => item.id !== itemId));
    setSuccess('Item deleted successfully');
  };

  // Preferences handling functions
  const handlePreferencesUpdate = (updatedPreferences) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      preferences: { ...currentUser.preferences, ...updatedPreferences }
    };
    
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? updatedUser : user
    );
    
    saveUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setUserPreferences(updatedUser.preferences);
    setSuccess('Preferences updated successfully!');
  };

  const loadUserPreferences = () => {
    if (currentUser && currentUser.preferences) {
      setUserPreferences(currentUser.preferences);
    }
  };

  useEffect(() => {
    loadUserPreferences();
  }, [currentUser]);

  const getUserWardrobe = () => {
    return wardrobe.filter(item => item.userId === currentUser?.id);
  };

  const handleGenerateOutfit = async () => {
    if (!occasion) {
      setError('Please enter an occasion');
      return;
    }

    const userWardrobe = getUserWardrobe();

    if (userWardrobe.length < 3) {
      setError('You need at least 3 items in your wardrobe to generate an outfit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recommendation = await generateOutfitWithGemini(userWardrobe, occasion, currentUser?.preferences);

      const selectedItems = userWardrobe.filter(item =>
          recommendation.selectedItems.includes(item.id)
      );

      setRecommendedOutfit({
        items: selectedItems,
        styleNote: recommendation.styleNote,
        occasion
      });

      setSuccess('Outfit generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate outfit');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800">FitMate</h1>
              </div>

              {currentUser ? (
                  <nav className="flex items-center gap-2">
                    <button
                        onClick={() => { setCurrentView('wardrobe'); setError(''); setSuccess(''); setRecommendedOutfit(null); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'wardrobe' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <ShoppingBag className="w-4 h-4" /> Wardrobe
                    </button>
                    <button
                        onClick={() => { setCurrentView('upload'); setError(''); setSuccess(''); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                    <button
                        onClick={() => { setCurrentView('outfit'); setError(''); setSuccess(''); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'outfit' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Sparkles className="w-4 h-4" /> Get Outfit
                    </button>
                    <button
                        onClick={() => { setCurrentView('eventplanner'); setError(''); setSuccess(''); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'eventplanner' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Calendar className="w-4 h-4" /> Event Planner
                    </button>
                    <button
                        onClick={() => { setCurrentView('preferences'); setError(''); setSuccess(''); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'preferences' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Settings className="w-4 h-4" /> Preferences
                    </button>
                    <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">{currentUser.name}</span>
                      </div>
                      <button
                          onClick={handleLogout}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </nav>
              ) : (
                  <nav className="flex gap-2">
                    <button
                        onClick={() => setCurrentView('home')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            currentView === 'home' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Home className="w-4 h-4" /> Home
                    </button>
                    <button
                        onClick={() => setCurrentView('signin')}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      Sign In
                    </button>
                    <button
                        onClick={() => setCurrentView('signup')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Sign Up
                    </button>
                  </nav>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {currentView === 'home' && <HomeView setCurrentView={setCurrentView} />}
          {currentView === 'signin' && <SignInView authForm={authForm} setAuthForm={setAuthForm} handleSignIn={handleSignIn} error={error} success={success} setCurrentView={setCurrentView} />}
          {currentView === 'signup' && <SignUpView authForm={authForm} setAuthForm={setAuthForm} handleSignUp={handleSignUp} error={error} setCurrentView={setCurrentView} />}
          {currentView === 'upload' && currentUser && <UploadView 
            selectedFile={selectedFile} 
            preview={preview} 
            handleFileSelect={handleFileSelect} 
            handleUpload={handleUpload} 
            loading={loading} 
            error={error} 
            success={success}
            uploadMode={uploadMode}
            setUploadMode={setUploadMode}
            bulkFiles={bulkFiles}
            bulkPreview={bulkPreview}
            handleBulkFileSelect={handleBulkFileSelect}
            handleZipUpload={handleZipUpload}
            handleBulkUpload={handleBulkUpload}
            bulkLoading={bulkLoading}
            uploadProgress={uploadProgress}
          />}
          {currentView === 'wardrobe' && currentUser && <WardrobeView wardrobe={getUserWardrobe()} handleDeleteItem={handleDeleteItem} success={success} setCurrentView={setCurrentView} />}
          {currentView === 'preferences' && currentUser && <PreferencesView userPreferences={userPreferences} handlePreferencesUpdate={handlePreferencesUpdate} success={success} error={error} />}
          {currentView === 'outfit' && currentUser && <OutfitView occasion={occasion} setOccasion={setOccasion} handleGenerateOutfit={handleGenerateOutfit} recommendedOutfit={recommendedOutfit} loading={loading} error={error} success={success} />}
          {currentView === 'eventplanner' && currentUser && <EventPlanner />}
        </main>
      </div>
  );
}

// ============= VIEW COMPONENTS =============

const HomeView = ({ setCurrentView }) => (
    <div className="text-center py-16">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to FitMate</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your AI-powered digital wardrobe. Upload your clothes, let AI analyze them, and get personalized outfit recommendations!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
          <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Upload Clothes</h3>
          <p className="text-gray-600 text-sm">Take photos of your clothing items and upload them to your digital closet</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
          <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
          <p className="text-gray-600 text-sm">Our AI automatically identifies type, color, material, and style of each item</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
          <ShoppingBag className="w-12 h-12 text-pink-600 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Smart Outfits</h3>
          <p className="text-gray-600 text-sm">Get AI-generated outfit recommendations for any occasion</p>
        </div>
      </div>

      <button
          onClick={() => setCurrentView('signup')}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
      >
        Get Started
      </button>
    </div>
);

const SignInView = ({ authForm, setAuthForm, handleSignIn, error, success, setCurrentView }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-600 text-center mb-6">Sign in to your FitMate account</p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="••••••••"
            />
          </div>

          <button
              onClick={handleSignIn}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <button onClick={() => setCurrentView('signup')} className="text-indigo-600 font-semibold hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
);

const SignUpView = ({ authForm, setAuthForm, handleSignUp, error, setCurrentView }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
        <p className="text-gray-600 text-center mb-6">Start building your digital wardrobe</p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="••••••••"
            />
          </div>

          <button
              onClick={handleSignUp}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <button onClick={() => setCurrentView('signin')} className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
);

const UploadView = ({ 
  selectedFile, preview, handleFileSelect, handleUpload, loading, error, success,
  uploadMode, setUploadMode, bulkFiles, bulkPreview, handleBulkFileSelect, 
  handleZipUpload, handleBulkUpload, bulkLoading, uploadProgress 
}) => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Upload Clothing Items</h2>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <p className="text-gray-600 mb-6">
          Add items to your digital wardrobe. Choose between single upload or bulk upload from multiple files or ZIP archives.
        </p>

        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {success}
        </div>}
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Upload Mode Toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUploadMode('single')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                uploadMode === 'single' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => setUploadMode('bulk')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                uploadMode === 'bulk' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Single Upload Mode */}
        {uploadMode === 'single' && (
          <div className="mb-6">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
            />

            <label
                htmlFor="file-upload"
                className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="max-h-96 mx-auto rounded-lg" />
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-semibold text-gray-700">Click to upload</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
              )}
            </label>

            {selectedFile && (
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing with AI...
                      </>
                  ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Upload & Analyze
                      </>
                  )}
                </button>
            )}
          </div>
        )}

        {/* Bulk Upload Mode */}
        {uploadMode === 'bulk' && (
          <div className="space-y-6">
            {/* File Selection Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Multiple Files Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Upload Multiple Files
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkFileSelect}
                  className="hidden"
                  id="bulk-file-upload"
                />
                <label
                  htmlFor="bulk-file-upload"
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
                >
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Select Multiple Images</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF files</p>
                </label>
              </div>

              {/* ZIP Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Upload ZIP Archive
                </h3>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="hidden"
                  id="zip-upload"
                />
                <label
                  htmlFor="zip-upload"
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
                >
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Select ZIP File</p>
                  <p className="text-xs text-gray-500">Extract images automatically</p>
                </label>
              </div>
            </div>

            {/* Bulk Preview */}
            {bulkPreview.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Preview ({bulkPreview.length} images)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                  {bulkPreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <div className="absolute top-1 right-1 bg-white rounded-full p-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress.total > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Processing Images</span>
                  <span className="text-sm text-gray-500">{uploadProgress.current}/{uploadProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Bulk Upload Button */}
            {bulkFiles.length > 0 && (
              <button
                onClick={handleBulkUpload}
                disabled={bulkLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing {uploadProgress.current}/{uploadProgress.total} images...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Upload & Analyze {bulkFiles.length} Items
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
);

const WardrobeView = ({ wardrobe, handleDeleteItem, success, setCurrentView }) => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Wardrobe</h2>
          <p className="text-gray-600 mt-1">{wardrobe.length} items in your collection</p>
        </div>
      </div>

      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm">{success}</div>}

      {wardrobe.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your wardrobe is empty</h3>
            <p className="text-gray-600 mb-6">Start by uploading your first clothing item</p>
            <button
                onClick={() => setCurrentView('upload')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Upload Item
            </button>
          </div>
      ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wardrobe.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="h-64 overflow-hidden bg-gray-100">
                    <img
                        src={item.imageUrl}
                        alt={item.aiDescription.type}
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 capitalize">
                      {item.aiDescription.type}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {item.aiDescription.color}
                </span>
                      {item.aiDescription.style.map((style, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {style}
                  </span>
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.aiDescription.fullDescription}
                    </p>
                    {item.aiDescription.material && (
                        <p className="text-gray-500 text-xs italic mb-3">
                          Material: {item.aiDescription.material}
                        </p>
                    )}
                    <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
            ))}
          </div>
      )}
    </div>
);

const OutfitView = ({ occasion, setOccasion, handleGenerateOutfit, recommendedOutfit, loading, error, success }) => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Outfit Recommendation</h2>
      <p className="text-gray-600 mb-6">
        Tell us the occasion and we'll create the perfect outfit from your wardrobe
      </p>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> {success}
      </div>}

      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's the occasion?
        </label>
        <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent mb-4"
            placeholder="e.g., Business Casual Meeting, Summer Beach Day, Dinner Date"
        />

        <button
            onClick={handleGenerateOutfit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Outfit...
              </>
          ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Outfit
              </>
          )}
        </button>
      </div>

      {recommendedOutfit && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Your Perfect Outfit</h3>
              <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold mb-4">
                Occasion: {recommendedOutfit.occasion}
              </div>
              <p className="text-gray-700 text-lg italic max-w-2xl mx-auto">
                "{recommendedOutfit.styleNote}"
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedOutfit.items.map(item => (
                  <div key={item.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl overflow-hidden border-2 border-indigo-200">
                    <div className="h-64 overflow-hidden bg-white">
                      <img
                          src={item.imageUrl}
                          alt={item.aiDescription.type}
                          className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h4 className="text-lg font-semibold text-gray-800 capitalize mb-1">
                        {item.aiDescription.type}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {item.aiDescription.color}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
      )}
    </div>
);

const PreferencesView = ({ userPreferences, handlePreferencesUpdate, success, error }) => {
  const [preferences, setPreferences] = useState({
    ...userPreferences,
    // Store raw text values for input fields
    comfortPreferencesText: userPreferences.comfortPreferences?.join(', ') || '',
    stylePreferencesText: userPreferences.stylePreferences?.join(', ') || '',
    dislikesText: userPreferences.dislikes?.join(', ') || ''
  });

  useEffect(() => {
    setPreferences({
      ...userPreferences,
      comfortPreferencesText: userPreferences.comfortPreferences?.join(', ') || '',
      stylePreferencesText: userPreferences.stylePreferences?.join(', ') || '',
      dislikesText: userPreferences.dislikes?.join(', ') || ''
    });
  }, [userPreferences]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process text fields back into arrays
    const processedPreferences = {
      ...preferences,
      comfortPreferences: preferences.comfortPreferencesText.split(',').map(item => item.trim()).filter(item => item),
      stylePreferences: preferences.stylePreferencesText.split(',').map(item => item.trim()).filter(item => item),
      dislikes: preferences.dislikesText.split(',').map(item => item.trim()).filter(item => item)
    };
    
    // Remove the temporary text fields
    delete processedPreferences.comfortPreferencesText;
    delete processedPreferences.stylePreferencesText;
    delete processedPreferences.dislikesText;
    
    handlePreferencesUpdate(processedPreferences);
  };

  const handleArrayChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleTextChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const bodyTypes = ['Petite', 'Average', 'Tall', 'Plus Size', 'Athletic', 'Curvy', 'Slim'];
  const fitOptions = ['Loose', 'Fitted', 'Oversized', 'Regular', 'Tight'];
  const shoeTypes = ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals', 'Loafers', 'Athletic'];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Style Preferences</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-8">
        <p className="text-gray-600 mb-6">
          Tell us about your style preferences so we can provide more personalized outfit recommendations.
        </p>

        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {success}
        </div>}
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Body Type</label>
            <select
              value={preferences.bodyType || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, bodyType: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">Select your body type</option>
              {bodyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Comfort Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Comfort Preferences</label>
            <input
              type="text"
              value={preferences.comfortPreferencesText || ''}
              onChange={(e) => handleTextChange('comfortPreferencesText', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="e.g., loose fitting, breathable fabrics, no tight waistbands"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple preferences with commas</p>
          </div>

          {/* Style Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Style Preferences</label>
            <input
              type="text"
              value={preferences.stylePreferencesText || ''}
              onChange={(e) => handleTextChange('stylePreferencesText', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="e.g., casual, minimalist, bohemian, preppy, streetwear"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple styles with commas</p>
          </div>

          {/* Dislikes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Items/Styles You Dislike</label>
            <input
              type="text"
              value={preferences.dislikesText || ''}
              onChange={(e) => handleTextChange('dislikesText', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="e.g., tight jeans, high heels, bright colors, crop tops"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple dislikes with commas</p>
          </div>

          {/* Shoe Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Shoe Types</label>
            <select
              value={preferences.shoePreferences || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, shoePreferences: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">Select preferred shoe type</option>
              {shoeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Fit Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Fit</label>
            <select
              value={preferences.fitPreferences || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, fitPreferences: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">Select preferred fit</option>
              {fitOptions.map(fit => (
                <option key={fit} value={fit}>{fit}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};