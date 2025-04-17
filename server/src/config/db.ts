import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB connected');
  } catch (err: any) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};
