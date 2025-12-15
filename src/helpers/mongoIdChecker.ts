import mongoose from "mongoose";

export const safeObjectId = (id: any): string | null => {
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
};