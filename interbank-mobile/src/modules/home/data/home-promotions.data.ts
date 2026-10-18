import type {
  HomePromotion,
  HomePromotionShortcut,
} from "@/src/modules/home/models/home-promotion.model";

export const HOME_PROMOTIONS: HomePromotion[] = [
  {
    id: "cinema-benefit",
    category: "Cines",
    title: "50% dscto.",
    description: "Disfruta tus entradas seleccionadas",
    actionLabel: "Conocer beneficio",
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=82",
    variant: "cinema",
  },
  {
    id: "restaurant-benefit",
    category: "Restaurantes",
    title: "30% dscto.",
    description: "Sabores para compartir todos los días",
    actionLabel: "Ver restaurantes",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=82",
    variant: "food",
  },
  {
    id: "security-benefit",
    category: "Seguridad",
    title: "Compra seguro",
    description: "Controla tus tarjetas desde la app",
    actionLabel: "Configurar ahora",
    imageUrl:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=82",
    variant: "security",
  },
];

export const HOME_PROMOTION_SHORTCUTS: HomePromotionShortcut[] = [
  {
    id: "whatsapp",
    label: "Plinea por WhatsApp",
    variant: "whatsapp",
  },
  {
    id: "security",
    label: "Controla tu seguridad",
    variant: "security",
  },
];
