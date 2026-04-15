import { db } from "@/lib/firebase";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";

// Structure definition to ensure data consistency across the platform
interface CategorySeed {
  id: string;
  name: string;
  iconName: string;
  description: string;
  searchTags: string[];
}

const categories: CategorySeed[] = [
  { 
    id: "gaming", 
    name: "Gaming", 
    iconName: "Gamepad2", 
    description: "E-sports, tournaments, and casual gaming meetups.", 
    searchTags: ["esports", "streaming", "pc", "console", "gaming"] 
  },
  { 
    id: "music", 
    name: "Music", 
    iconName: "Music", 
    description: "Concerts, festivals, and instrumental workshops.", 
    searchTags: ["live", "instruments", "vocals", "dj", "concert"] 
  },
  { 
    id: "book", 
    name: "Book", 
    iconName: "BookOpen", 
    description: "Reading clubs, author signings, and literature meets.", 
    searchTags: ["literature", "writing", "library", "reading", "author"] 
  },
  { 
    id: "language", 
    name: "Language", 
    iconName: "Languages", 
    description: "Language exchange, translation workshops, and cultural learning.", 
    searchTags: ["polyglot", "translation", "culture", "linguistics", "exchange"] 
  },
  { 
    id: "photography", 
    name: "Photography", 
    iconName: "Camera", 
    description: "Visual arts, photo walks, and editing masterclasses.", 
    searchTags: ["editing", "dslr", "portfolio", "visuals", "creative"] 
  },
  { 
    id: "fashion", 
    name: "Fashion", 
    iconName: "Shirt", 
    description: "Runway events, styling workshops, and apparel design.", 
    searchTags: ["apparel", "design", "modeling", "trends", "style"] 
  },
  { 
    id: "nature", 
    name: "Nature", 
    iconName: "Leaf", 
    description: "Outdoor adventures, hiking, and conservation efforts.", 
    searchTags: ["hiking", "eco", "wildlife", "outdoor", "environment"] 
  },
  { 
    id: "fitness", 
    name: "Fitness", 
    iconName: "Dumbbell", 
    description: "Health, physical training, and wellness sessions.", 
    searchTags: ["gym", "workout", "cardio", "hiit", "strength"] 
  },
  { 
    id: "animal", 
    name: "Animal", 
    iconName: "Dog", 
    description: "Pet meets, veterinary seminars, and animal welfare.", 
    searchTags: ["pets", "veterinary", "adoption", "animals", "welfare"] 
  },
  { 
    id: "arts", 
    name: "Arts", 
    iconName: "Palette", 
    description: "Visual and creative expressions, painting, and sculpting.", 
    searchTags: ["painting", "sculpture", "gallery", "fine arts", "exhibition"] 
  },
  { 
    id: "sports", 
    name: "Sports", 
    iconName: "Trophy", 
    description: "Competitive and recreational athletic events.", 
    searchTags: ["football", "basketball", "athlete", "tournament", "competition"] 
  },
  { 
    id: "finance", 
    name: "Finance", 
    iconName: "DollarSign", 
    description: "Wealth management, trading, and market analysis.", 
    searchTags: ["trading", "investment", "crypto", "banking", "wealth"] 
  },
  { 
    id: "technology", 
    name: "Technology", 
    iconName: "Cpu", 
    description: "Hardware, AI research, and software innovation.", 
    searchTags: ["hardware", "coding", "robotics", "ai", "innovation"] 
  },
  { 
    id: "business", 
    name: "Business", 
    iconName: "Briefcase", 
    description: "Entrepreneurship, networking, and corporate seminars.", 
    searchTags: ["startup", "corporate", "marketing", "leadership", "networking"] 
  },
  { 
    id: "travel", 
    name: "Travel", 
    iconName: "Plane", 
    description: "Tourism, exploration, and backpacking trips.", 
    searchTags: ["vacation", "backpacking", "hotel", "tourism", "adventure"] 
  },
  { 
    id: "cars", 
    name: "Cars", 
    iconName: "Car", 
    description: "Automotive exhibitions and motorsport events.", 
    searchTags: ["racing", "luxury", "ev", "automotive", "motorsports"] 
  },
  { 
    id: "dance", 
    name: "Dance", 
    iconName: "Accessibility", 
    description: "Movement, choreography, and performance arts.", 
    searchTags: ["zumba", "salsa", "hiphop", "ballet", "rhythm"] 
  },
  { 
    id: "workshop", 
    name: "Workshop", 
    iconName: "Hammer", 
    description: "Skill-building sessions and DIY craft projects.", 
    searchTags: ["craft", "learning", "skills", "diy", "hands-on"] 
  }
];

export const seedCategories = async () => {
  const batch = writeBatch(db);

  try {
    categories.forEach((cat) => {
      // Using consistent document IDs prevents duplicates
      const docRef = doc(db, "categories", cat.id); 
      
      batch.set(docRef, {
        name: cat.name,
        iconName: cat.iconName,
        description: cat.description,
        searchTags: cat.searchTags,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log("✅ All 18 categories synced to Eventra successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Seeding failed: ", error);
    return { success: false, error };
  }
};