import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_KEY_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
});

const rwClient = client.readWrite;

export async function postTweet(text: string) {
    try {
        const tweet = await rwClient.v2.tweet(text);
        console.log('Tweet posted successfully:', tweet.data.id);
        return tweet.data;
    } catch (error) {
        console.error('Error posting tweet:', error);
        throw error;
    }
}
