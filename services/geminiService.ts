import { TravelStyle, Booking, Attraction } from "../types";

let apiKey = process.env.API_KEY || '';

const getStoredKey = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('GEMINI_API_KEY') || '';
};

const initKey = () => {
    const stored = getStoredKey();
    if (stored) {
        apiKey = stored;
    }
};

initKey();

const GEMINI_BASE_URL = 'https://ai.juguang.chat/v1beta/models';

const buildTextRequest = (prompt: string, maxOutputTokens = 1024) => ({
    contents: [
        {
            parts: [{ text: prompt }]
        }
    ],
    generationConfig: {
        temperature: 0.7,
        topK: 20,
        topP: 0.8,
        maxOutputTokens
    }
});

const buildImageRequest = (prompt: string, maxOutputTokens = 1024) => ({
    contents: [
        {
            parts: [{ text: prompt }]
        }
    ],
    generationConfig: {
        temperature: 0.7,
        topK: 20,
        topP: 0.8,
        maxOutputTokens
    },
    safetySettings: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
});

const buildChatRequest = (
    history: { role: string; parts: { text: string }[] }[],
    message: string
) => ({
    contents: [
        ...history.map((item) => ({
            role: item.role,
            parts: item.parts
        })),
        {
            role: 'user',
            parts: [{ text: message }]
        }
    ],
    generationConfig: {
        temperature: 0.6,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024
    }
});

const fetchGemini = async (model: string, body: unknown) => {
    const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    return response.json();
};

const extractText = (response: any) =>
    response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

const extractImageUrl = (response: any) => {
    // Preferred inlineData
    const parts = response?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part?.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
        }
    }

    // Alternate response shapes seen in other endpoints
    if (response?.image?.url) return response.image.url;
    if (Array.isArray(response?.images) && response.images.length > 0) {
        return response.images[0]?.url || response.images[0];
    }
    if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data[0]?.url || response.data[0];
    }

    return null;
};

export const setApiKey = (key: string) => {
    apiKey = key.trim();
    if (typeof window !== 'undefined') {
        if (apiKey) {
            localStorage.setItem('GEMINI_API_KEY', apiKey);
        } else {
            localStorage.removeItem('GEMINI_API_KEY');
        }
    }
};

export const generateConciergeInfo = async (
  attractionName: string,
  city: string,
  travelStyle: TravelStyle
): Promise<string> => {
  if (!apiKey) return "Please configure your API Key to access AI insights.";

  try {
    const prompt = `
      Act as a luxury hotel concierge. 
      Write a short, engaging 2-sentence cultural fact or tip about ${attractionName} in ${city}.
      Tailor the tone for a ${travelStyle} traveler.
    `;

    const response = await fetchGemini('gemini-2.0-flash-lite', buildTextRequest(prompt, 512));
    const text = extractText(response);
    return text || "Information unavailable at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our concierge service is momentarily unavailable.";
  }
};

export const generateSouvenirCaption = async (
  location: string,
  travelStyle: TravelStyle
): Promise<string> => {
  if (!apiKey) return "To travel is to live.";

  try {
    const prompt = `
      Generate a short, inspiring travel quote (max 10 words) for a postcard from ${location}.
      The vibe should be ${travelStyle}. 
      Do not include quotes or attribution, just the text.
    `;

    const response = await fetchGemini('gemini-2.0-flash-lite', buildTextRequest(prompt, 128));
    const text = extractText(response);
    return text?.trim() || "Memories made here.";
  } catch (error) {
    return "A moment in time.";
  }
};

export const generatePostcardImage = async (
    hotelName: string,
    location: string,
    style: TravelStyle
): Promise<string | null> => {
    if (!apiKey) return null;

    try {
        const prompt = `
            A beautiful, artistic travel poster illustration of ${hotelName} in ${location}.
            Style: ${style} vibe, high-end digital art, warm lighting, scenic view. 
            The image should look like a premium collectible postcard.
            No text overlay.
        `;

        const response = await fetchGemini(
            'gemini-2.5-flash-image-preview',
            buildImageRequest(prompt, 1024)
        );
        return extractImageUrl(response);
    } catch (error) {
        console.error("Postcard Gen Error:", error);
        return null;
    }
}

// "Nano Banana" - Avatar Generation
export const generateAvatar = async (style: TravelStyle): Promise<string | null> => {
    if (!apiKey) return null;

    try {
        // Updated prompt for cleaner, brighter, preset-matching style
        const prompt = `
            Generate a 3D icon of a cute traveler avatar.
            Style: Pixar/Disney 3D animation style.
            Lighting: Bright studio lighting, soft shadows.
            Background: Plain white or very soft light gray background (clean).
            Character: ${style} traveler, friendly expression, vibrant colors.
            Composition: Centered headshot icon. 
            Do not include complex backgrounds or dark moody lighting.
        `;

        const response = await fetchGemini(
            'gemini-2.5-flash-image-preview',
            buildImageRequest(prompt, 1024)
        );
        return extractImageUrl(response);
    } catch (error) {
        console.error("Avatar Gen Error:", error);
        return null;
    }
}

// "Nano Banana" - Attraction 3D Asset Generation
export const generateAttractionImage = async (type: string, name: string): Promise<string | null> => {
    if (!apiKey) return null;

    try {
        const prompt = `
            Generate a cute 3D icon representing a ${type} (related to ${name}).
            Style: High-quality 3D render, toy-like, clay material, soft studio lighting, bright colors, isolated on plain white background.
            The object should look like a collectible miniature.
            If the type is generic, create a 3D map pin or location marker.
            Minimalist, single object.
        `;

        const response = await fetchGemini(
            'gemini-2.5-flash-image-preview',
            buildImageRequest(prompt, 1024)
        );
        return extractImageUrl(response);
    } catch (error) {
        console.error("Attraction Image Gen Error:", error);
        return null;
    }
}

// NEW: Dynamic Attraction Generation (JSON)
export const generateDynamicAttractions = async (
    location: string,
    style: TravelStyle
): Promise<Attraction[]> => {
    if (!apiKey) return [];

    try {
        const prompt = `
            Identify 3 "Nearby" hidden gems/activities and 3 "Must-See" famous landmarks in ${location}.
            Target Audience: ${style} traveler.
            Return a JSON object with a list of attractions.
            For 'icon', suggest a valid Material Symbol name (snake_case) that represents the place (e.g. 'restaurant', 'park', 'museum', 'photo_camera').
        `;

        const response = await fetchGemini('gemini-2.0-flash-lite', buildTextRequest(prompt, 1024));
        const text = extractText(response) || "{}";
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        const json = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
        const list = json.attractions || [];

        // Map to internal Attraction interface
        return list.map((item: any, index: number) => ({
            id: 9000 + index + Math.floor(Math.random() * 1000), // Random ID to avoid collision
            name: item.name,
            type: item.type,
            category: item.category,
            icon: item.icon || 'place',
            description: item.description,
            coordinates: { top: '50%', left: '50%' }, // Dummy coordinates as we use iframe maps
            imageUrl: '' // Will be generated separately
        }));

    } catch (error) {
        console.error("Dynamic Attraction Gen Error:", error);
        return [];
    }
}

export const chatWithConcierge = async (
    message: string, 
    history: {role: string, parts: {text: string}[]}[],
    context: string
) => {
    if (!apiKey) return "System offline.";

    try {
        const systemPrompt = `You are a helpful, sophisticated hotel concierge at ${context}. Keep answers brief (under 50 words) and helpful.`;
        const prompt = `${systemPrompt}\n\nUser: ${message}`;
        const response = await fetchGemini('gemini-2.0-flash-lite', buildTextRequest(prompt, 512));
        return extractText(response) || "";
    } catch (error) {
        console.error("Chat Error", error);
        return "I am having trouble connecting to the concierge network.";
    }
}

export const generateItinerary = async (
    booking: Booking,
    style: TravelStyle
): Promise<string> => {
    if (!apiKey) return "Itinerary generation offline.";

    try {
        const prompt = `
            Create a brief, daily itinerary for a trip to ${booking.location}.
            Traveler Style: ${style}.
            Dates: ${booking.checkInDate} to ${booking.checkOutDate}.
            Format: Markdown, bullet points.
            Focus: Provide a "Theme of the Day" and 2 key activities per day.
            Keep it concise and exciting.
        `;

        const response = await fetchGemini('gemini-2.0-flash-lite', buildTextRequest(prompt, 1024));
        return extractText(response) || "Could not generate itinerary.";
    } catch (error) {
        return "Itinerary service momentarily unavailable.";
    }
}
