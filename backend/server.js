const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Google AI
const genAI = new GoogleGenerativeAI('AIzaSyAB_Op-OSznS9AVm6QYqqfiBson5yNO46g');

// Mock wardrobe data
const user_wardrobe = [
  {"id": 1, "name": "Red Hoodie", "category": "top", "tags": ["casual", "sporty"]},
  {"id": 2, "name": "Blue Jeans", "category": "pants", "tags": ["casual"]},
  {"id": 3, "name": "White Button-Down", "category": "top", "tags": ["smart-casual", "formal"]},
  {"id": 4, "name": "Black Slacks", "category": "pants", "tags": ["smart-casual", "professional", "formal"]},
  {"id": 5, "name": "Running Shorts", "category": "pants", "tags": ["sporty"]},
  {"id": 6, "name": "Team Jersey", "category": "top", "tags": ["sporty", "casual"]}
];

// AI Classification function
async function classifyEventStyle(eventName, eventDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `You are a fashion stylist. I am attending an event. Event Name: "${eventName}" Event Description: "${eventDescription}" Based on both the name and description, return a single, most important style tag. The only possible tags you can return are: sporty, casual, smart-casual, professional, or formal. Return only the single tag as a string.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const styleTag = response.text().trim().toLowerCase();
    
    // Validate the response
    const validTags = ['sporty', 'casual', 'smart-casual', 'professional', 'formal'];
    if (validTags.includes(styleTag)) {
      return styleTag;
    } else {
      // Fallback to casual if AI returns something unexpected
      console.warn(`AI returned unexpected style tag: ${styleTag}, defaulting to casual`);
      return 'casual';
    }
  } catch (error) {
    console.error('Error in AI classification:', error);
    // Fallback to casual if AI fails
    return 'casual';
  }
}

// Find outfit based on style tag
function findOutfit(styleTag) {
  const tops = user_wardrobe.filter(item => item.category === 'top' && item.tags.includes(styleTag));
  const pants = user_wardrobe.filter(item => item.category === 'pants' && item.tags.includes(styleTag));
  
  // Check if we found both a top and pants
  if (tops.length === 0 || pants.length === 0) {
    return null; // No matching outfit found
  }
  
  return {
    top: tops[0].name,
    pants: pants[0].name
  };
}

// API endpoint
app.post('/api/outfit-for-event', async (req, res) => {
  try {
    const { eventName, eventDescription } = req.body;
    
    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    
    console.log(`Processing event: ${eventName}`);
    if (eventDescription) {
      console.log(`Event description: ${eventDescription}`);
    }
    
    // Step 1: AI Classification
    const styleTag = await classifyEventStyle(eventName, eventDescription || '');
    console.log(`Classified style tag: ${styleTag}`);
    
    // Step 2: Find outfit
    const outfit = findOutfit(styleTag);
    console.log(`Found outfit:`, outfit);
    
    // Step 3: Check if outfit was found
    if (!outfit) {
      return res.status(404).json({ 
        message: "No matching outfit found in your wardrobe for this event." 
      });
    }
    
    // Step 4: Return response
    res.json({ outfit });
    
  } catch (error) {
    console.error('Error in outfit recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background removal endpoint
app.post('/api/process-image', upload.single('image'), async (req, res) => {
  try {
    // Check if req.file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Create FormData object
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Append the req.file.buffer as 'image_file' and set 'size' to 'preview'
    formData.append('image_file', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype
    });
    formData.append('size', 'preview');

    // Use axios.post to call remove.bg API
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': '8vH1T3MGcVuK1b4G9V65x1JG'
      },
      responseType: 'arraybuffer'
    });

    // Convert the response.data buffer to a Base64 data URL
    const base64 = Buffer.from(response.data).toString('base64');
    const processedImageUrl = `data:image/png;base64,${base64}`;

    // Send it back as JSON
    res.json({ processedImageUrl });

  } catch (error) {
    console.error('Error in background removal:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FitMate Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`FitMate Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
