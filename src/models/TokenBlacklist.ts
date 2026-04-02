import mongoose, { Schema, Document } from "mongoose";

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB TTL index — automatically deletes expired tokens so the collection doesn't grow forever
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ITokenBlacklist>("TokenBlacklist", tokenBlacklistSchema);
