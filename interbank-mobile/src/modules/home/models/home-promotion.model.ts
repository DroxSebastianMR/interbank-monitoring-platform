export interface HomePromotion {
  id: string;
  category: string;
  title: string;
  description: string;
  actionLabel: string;
  imageUrl: string;
  variant: "cinema" | "food" | "security";
}

export interface HomePromotionShortcut {
  id: string;
  label: string;
  variant: "whatsapp" | "security";
}
