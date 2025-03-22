
import { REMOVE_BG_API_KEY } from '@/config';

export const removeBg = async (file: File): Promise<string> => {
  try {
    // For development, use a mock API that just returns the original image
    // In a real app, you would call the actual remove.bg API
    // This is to save API credits during development
    if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY === 'MOCK_API_KEY') {
      console.log('Using mock remove.bg API');
      return await mockRemoveBg(file);
    }

    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

// Mock remove.bg API for development purposes
const mockRemoveBg = async (file: File): Promise<string> => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Just return the original file as a data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
