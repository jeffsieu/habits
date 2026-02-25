import {
  Activity,
  Apple,
  Baby,
  Bed,
  Beer,
  Bike,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  Car,
  Check,
  CircleDot,
  Clock,
  Cloud,
  Code,
  Coffee,
  Compass,
  CreditCard,
  Dumbbell,
  FlaskConical,
  Flower,
  Gamepad2,
  Gift,
  Glasses,
  GraduationCap,
  Guitar,
  HandHeart,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  Leaf,
  LucideIcon,
  MessageCircle,
  Moon,
  Mountain,
  Music,
  Palette,
  Pencil,
  Phone,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Play,
  Podcast,
  Puzzle,
  Salad,
  Scale,
  Scissors,
  Smile,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  TreeDeciduous,
  Trophy,
  Tv,
  User,
  UtensilsCrossed,
  Wallet,
  Watch,
  Waves,
  Wine,
  Zap,
} from "lucide-react";

// Map of icon names to their components
export const HABIT_ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  apple: Apple,
  baby: Baby,
  bed: Bed,
  beer: Beer,
  bike: Bike,
  book: Book,
  "book-open": BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  camera: Camera,
  car: Car,
  check: Check,
  "circle-dot": CircleDot,
  clock: Clock,
  cloud: Cloud,
  code: Code,
  coffee: Coffee,
  compass: Compass,
  "credit-card": CreditCard,
  dumbbell: Dumbbell,
  "flask-conical": FlaskConical,
  flower: Flower,
  "gamepad-2": Gamepad2,
  gift: Gift,
  glasses: Glasses,
  "graduation-cap": GraduationCap,
  guitar: Guitar,
  "hand-heart": HandHeart,
  headphones: Headphones,
  heart: Heart,
  "heart-pulse": HeartPulse,
  home: Home,
  laptop: Laptop,
  leaf: Leaf,
  "message-circle": MessageCircle,
  moon: Moon,
  mountain: Mountain,
  music: Music,
  palette: Palette,
  pencil: Pencil,
  phone: Phone,
  "piggy-bank": PiggyBank,
  pill: Pill,
  pizza: Pizza,
  plane: Plane,
  play: Play,
  podcast: Podcast,
  puzzle: Puzzle,
  salad: Salad,
  scale: Scale,
  scissors: Scissors,
  smile: Smile,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  target: Target,
  timer: Timer,
  "tree-deciduous": TreeDeciduous,
  trophy: Trophy,
  tv: Tv,
  user: User,
  "utensils-crossed": UtensilsCrossed,
  wallet: Wallet,
  watch: Watch,
  waves: Waves,
  wine: Wine,
  zap: Zap,
};

// Array of icon options for the picker
export const HABIT_ICON_OPTIONS = Object.keys(HABIT_ICONS);

// Default colors for habits
export const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#78716c", // stone
];

// Get icon component by name
export function getHabitIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return CircleDot;
  return HABIT_ICONS[iconName] || CircleDot;
}

// Render a habit icon - use this instead of getHabitIcon in render
export function HabitIconDisplay({
  iconName,
  className,
}: {
  iconName?: string | null;
  className?: string;
}) {
  const icon = iconName && HABIT_ICONS[iconName] ? iconName : "CircleDot";
  const Icon = HABIT_ICONS[icon];
  return <Icon className={className} />;
}
