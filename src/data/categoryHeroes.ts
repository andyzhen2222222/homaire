/** 分类页横幅默认文案与头图（可被 Firestore config.global.categoryHeroes 覆盖） */
export const DEFAULT_CATEGORY_HEROES: Record<string, { title: string; subtitle: string; image: string }> = {
  sofas: {
    title: 'Sofas',
    subtitle: 'Comfortable living rooms, thoughtfully furnished.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000',
  },
  beds: {
    title: 'Beds',
    subtitle: 'The foundation of every great morning.',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=2000',
  },
  tables: {
    title: 'Tables',
    subtitle: 'Gather around modern craftsmanship.',
    image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=2000',
  },
  chairs: {
    title: 'Chairs',
    subtitle: 'Ergonomic support for every corner.',
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=2000',
  },
  garden: {
    title: 'Garden',
    subtitle: 'Outdoor comfort under open sky.',
    image: 'https://images.unsplash.com/photo-1517409197771-1520a09e8b91?auto=format&fit=crop&q=80&w=2000',
  },
  lighting: {
    title: 'Lighting',
    subtitle: 'Layered light for mood, focus, and everyday rituals.',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=2000',
  },
  storage: {
    title: 'Storage',
    subtitle: 'Calm surfaces, hidden order, rooms that breathe.',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=2000',
  },
  decor: {
    title: 'Decor',
    subtitle: 'Finishing touches that tie a room together.',
    image: 'https://images.unsplash.com/photo-1513519247388-4e284044efd3?auto=format&fit=crop&q=80&w=2000',
  },
  accessories: {
    title: 'Accessories',
    subtitle: 'Small pieces with outsized personality.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=2000',
  },
  sale: {
    title: 'Sale',
    subtitle: 'Limited-time access to brand favourites.',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=2000',
  },
};
