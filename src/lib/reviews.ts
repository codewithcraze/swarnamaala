export type Review = {
  name: string;
  location: string;
  rating: number;
  text: string;
};

// Sample customer reviews from the Delhi NCR region.
export const REVIEWS: Review[] = [
  {
    name: "Ananya Sharma",
    location: "Sector 62, Noida",
    rating: 5,
    text: "The quality blew me away. My wedding photos look stunning on the fridge and the colours are so rich. Delivered to Noida in just 3 days!",
  },
  {
    name: "Rahul Verma",
    location: "Connaught Place, Delhi",
    rating: 5,
    text: "Ordered the pack of 10 for return gifts. Everyone loved them. Packaging was premium and delivery across Delhi was super quick.",
  },
  {
    name: "Priya Malhotra",
    location: "DLF Phase 3, Gurugram",
    rating: 5,
    text: "I uploaded 3 different travel photos and each magnet came out perfect. Being able to preview before ordering is such a nice touch.",
  },
  {
    name: "Kabir Singh",
    location: "Rajouri Garden, Delhi",
    rating: 4,
    text: "Great value for money. The magnets are strong and hold well. Will definitely order again for my parents in Delhi.",
  },
  {
    name: "Sneha Gupta",
    location: "Sector 18, Noida",
    rating: 5,
    text: "Used the same baby photo for all 6 magnets and gifted them to family. The finish is glossy and looks really premium.",
  },
  {
    name: "Aditya Rao",
    location: "Cyber City, Gurugram",
    rating: 5,
    text: "Fast, easy and beautiful. Uploaded from my phone, ordered in two minutes, and got them delivered to Gurugram within the week.",
  },
];

export const AVERAGE_RATING =
  Math.round(
    (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length) * 10
  ) / 10;
