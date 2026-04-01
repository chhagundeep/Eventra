import { db } from "@/lib/firebase";
import { doc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

// 1. Define the structure to prevent future "searchTags" errors
interface CategorySeed {
  id: string;
  name: string;
  iconName: string;
  description: string;
  searchTags: string[];
}

const categories: CategorySeed[] = [
  {
    id: "yoga-meditation",
    name: "Yoga & Meditation",
    iconName: "Leaf",
    description: "Holistic wellness and mindfulness sessions.",
    searchTags: ["zen", "stretching", "mental health", "asana", "wellness"]
  },
  {
    id: "fitness-gym",
    name: "Fitness & Gym",
    iconName: "Dumbbell",
    description: "High-intensity workouts and strength training.",
    searchTags: ["hiit", "cardio", "weightlifting", "crossfit", "strength"]
  },
  {
    id: "tech-workshops",
    name: "Technology & Coding",
    iconName: "Code",
    description: "Bootcamps, seminars, and hands-on tech learning.",
    searchTags: ["programming", "ai", "webdev", "data science", "software"]
  },
  {
    id: "arts-photography",
    name: "Arts & Photography",
    iconName: "Camera",
    description: "Creative workshops for visual arts and capturing moments.",
    searchTags: ["painting", "editing", "visuals", "creative", "design"]
  },
  {
    id: "music-dance",
    name: "Music & Dance",
    iconName: "Music",
    description: "Rhythm, melody, and movement classes.",
    searchTags: ["zumba", "salsa", "instruments", "vocals", "performance"]
  }
];

export const seedCategories = async () => {
  const batch = writeBatch(db);

  categories.forEach((cat) => {
    // Using custom IDs for clean URLs (e.g., /category/yoga-meditation)
    const docRef = doc(db, "categories", cat.id); 
    
    batch.set(docRef, {
      name: cat.name,
      iconName: cat.iconName,
      description: cat.description,
      searchTags: cat.searchTags,
      isActive: true,
      createdAt: serverTimestamp(), // Use server time for consistency
      updatedAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
    console.log("✅ Eventra categories seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error seeding categories: ", error);
    return { success: false, error };
  }
};