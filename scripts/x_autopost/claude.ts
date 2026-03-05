import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateTweet(prompt: string, model: string = 'claude-sonnet-4-6') {
    const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });

    // Extract text from the response
    const content = response.content[0];
    if (content.type === 'text') {
        return content.text;
    }
    return '';
}
