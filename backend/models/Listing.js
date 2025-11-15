import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: Number,
    beds: Number,
    baths: Number,
    sqft: Number,
    city: String,
    country: String,
    status: {
      type: String,
      enum: ["for_sale", "for_rent", "sold"],
      default: "for_sale"
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    images: [String] // urls from e.g. Cloudinary
  },
  { timestamps: true }
);

export const Listing = mongoose.model("Listing", listingSchema);
