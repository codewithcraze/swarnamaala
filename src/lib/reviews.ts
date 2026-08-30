export type Review = {
  name: string;
  location: string;
  rating: number;
  text: string;
  image: string;
};

// Sample customer reviews from the Delhi NCR region.
export const REVIEWS: Review[] = [
    {
    name: "Alka Chaudhary",
    location: "Dwarka, Delhi",
    rating: 5,
    text: "Print is good and magnet is too strong.",
    image: "/feedback/alka.jpeg"
  },  {
    name: "Shekhar & Suman",
    location: "Bulandshahr",
    rating: 5,
    text: "Nice Magnets, Amazing product.",
    image: "/feedback/suman.jpeg"
  },
   {
    name: "Priyanka Thakur",
    location: "Greater Noida",
    rating: 5,
    text: "Very nice, Print Quality is good.",
    image: "/feedback/customer4.jpeg"
  },
  {
    name: "Deepak Chaudhary",
    location: "Sector 62, Noida",
    rating: 5,
    text: "Picture are so good. I asked them to create with different shapes and with resin work. Product deliverd is also good.",
    image: "/feedback/customer3.jpeg"
  },
  {
    name: "Priya S",
    location: "Mumbai",
    rating: 5,
    text: "The print quality blew me away — colors are exactly like the original photo. Fridge looks so much happier now!",
    image: "/feedback/customer.png"
  },
  {
    name: "Priya Malhotra",
    location: "DLF Phase 3, Gurugram",
    rating: 5,
    text: "I uploaded 3 different travel photos and each magnet came out perfect. Being able to preview before ordering is such a nice touch.",
    image: ""
  },
  {
    name: "Kabir Singh",
    location: "Rajouri Garden, Delhi",
    rating: 4,
    text: "Great value for money. The magnets are strong and hold well. Will definitely order again for my parents in Delhi.",
    image: ""
  },
  {
    name: "Sneha Gupta",
    location: "Sector 18, Noida",
    rating: 5,
    text: "Used the same baby photo for all 6 magnets and gifted them to family. The finish is glossy and looks really premium.",
    image: ""
  }
];

export const AVERAGE_RATING =
  Math.round(
    (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length) * 10
  ) / 10;
