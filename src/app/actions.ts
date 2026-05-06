'use server';

export interface MotivationData {
  message: string;
  date: string;
}

export interface ChatRequest {
  message: string;
  habitContext?: {
    habits: { title: string; completed: boolean }[];
    completionPercentage: number;
    totalXP?: number;
    level?: number;
  };
}

export interface MotivationRequest {
  habits: { title: string; completed: boolean }[];
  completionPercentage: number;
  totalXP?: number;
  level?: number;
}

// Updated to accept an optional system prompt and maxTokens
async function generateWithGroq(
  apiKey: string, 
  userPrompt: string, 
  systemPrompt?: string,
  maxTokens: number = 100
): Promise<string> {
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Throwing the raw text helps catch specific API errors (e.g., rate limits, invalid keys)
    throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateMotivation(data: MotivationRequest): Promise<MotivationData> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured in environment variables.');
    }

    const completedHabits = data.habits.filter(h => h.completed).map(h => h.title);
    const pendingHabits = data.habits.filter(h => !h.completed).map(h => h.title);

    const systemPrompt = "You are a motivational habit coach. Keep responses under 150 characters, energetic and positive.";
    const userPrompt = `Generate a short, encouraging motivation message (max 2 sentences) for a user with:
- Level: ${data.level || 'N/A'}
- Total XP: ${data.totalXP || 0}
- Completion rate: ${data.completionPercentage}%
- Completed habits: ${completedHabits.length > 0 ? completedHabits.join(', ') : 'None yet'}
- Pending habits: ${pendingHabits.length > 0 ? pendingHabits.join(', ') : 'None'}

Be specific about their progress. If they completed all habits, celebrate. If none, encourage starting. Otherwise, acknowledge completed ones and motivate for remaining.`;

    const message = await generateWithGroq(apiKey, userPrompt, systemPrompt, 100);

    return {
      message: message.trim() || "Keep going! Every step counts. 🚀",
      date: new Date().toISOString(),
    };
  } catch (error: unknown) {
    // Log this error to your server terminal so you can see exactly why it failed
    console.error('Error generating motivation:', error instanceof Error ? error.message : error);

    // Fallback logic
    if (data.completionPercentage === 100) {
      return { message: "Amazing! You've completed all habits today! You're unstoppable! 🔥", date: new Date().toISOString() };
    } else if (data.completionPercentage >= 50) {
      return { message: "Great progress! You're over halfway there. Keep the momentum going! 💪", date: new Date().toISOString() };
    } else if (data.completionPercentage > 0) {
      return { message: "Good start! Keep going to build that streak. You've got this! 🚀", date: new Date().toISOString() };
    } else {
      return { message: "Today is a new opportunity. Start with one habit and build from there! ✨", date: new Date().toISOString() };
    }
  }
}

export async function generateChatResponse(data: ChatRequest): Promise<{ message: string }> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured in environment variables.');
    }

    const systemPrompt = "You are Aura, an AI habit coach and productivity assistant. Be helpful, concise, and encouraging.";
    let userPrompt = `User question: ${data.message}`;

    if (data.habitContext) {
      const completed = data.habitContext.habits.filter(h => h.completed).map(h => h.title);
      const pending = data.habitContext.habits.filter(h => !h.completed).map(h => h.title);
      userPrompt += `\n\nUser's current context:
- Level: ${data.habitContext.level || 'N/A'}
- Total XP: ${data.habitContext.totalXP || 0}
- Completion rate: ${data.habitContext.completionPercentage}%
- Completed: ${completed.length > 0 ? completed.join(', ') : 'None'}
- Pending: ${pending.length > 0 ? pending.join(', ') : 'None'}`;
    }

    // Increased maxTokens to 300 so the chat response doesn't cut off abruptly
    const message = await generateWithGroq(apiKey, userPrompt, systemPrompt, 300);

    return {
      message: message.trim() || "I'm here to help! Could you rephrase that?",
    };
  } catch (error: unknown) {
    console.error('Error generating chat response:', error instanceof Error ? error.message : error);
    return {
      message: "I'm having trouble connecting right now. Please try again in a moment! 💫",
    };
  }
}