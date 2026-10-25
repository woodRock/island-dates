import type { Category, Cost, Recipe, Season, Setting } from './types'

type Starter = [
  id: string,
  title: string,
  icon: string,
  cost: Cost,
  durationMins: number,
  setting: Setting,
  category: Category,
  season: Season | null,
  materials: string[],
]

// Ids are stable so later versions can add ideas without duplicating ones already on the island.
const STARTERS: Starter[] = [
  // Aquarium: water dates
  ['beach-picnic', 'Beach picnic', '🧺', 1, 180, 'outdoor', 'aquarium', 'summer', ['Blanket', 'Sandwiches', 'Sunscreen']],
  ['sunset-swim', 'Sunset swim', '🌊', 0, 60, 'outdoor', 'aquarium', 'summer', ['Towels', 'Something warm for after']],
  ['kayak', 'Kayak adventure', '🛶', 2, 180, 'outdoor', 'aquarium', 'summer', ['Hire booking', 'Dry bag', 'Snacks']],
  ['rock-pools', 'Rock pool rummage', '🦀', 0, 90, 'outdoor', 'aquarium', null, ['Low tide time', 'Old shoes']],
  ['aquarium-visit', 'Aquarium visit', '🐠', 2, 150, 'indoor', 'aquarium', null, []],
  ['wharf-chips', 'Fish & chips on the wharf', '🐟', 1, 60, 'outdoor', 'aquarium', null, ['Vinegar', 'A bench with a view']],
  ['lake-fishing', 'Lake fishing day', '🎣', 1, 240, 'outdoor', 'aquarium', 'autumn', ['Rods', 'Bait', 'Thermos']],
  ['hot-pools', 'Hot pools soak', '♨️', 2, 120, 'outdoor', 'aquarium', 'winter', ['Togs', 'Towels']],
  ['paddleboard', 'Paddleboard lesson', '🏄', 2, 120, 'outdoor', 'aquarium', 'summer', ['Booking', 'Sunscreen']],
  ['ice-skating', 'Ice skating', '⛸️', 2, 120, 'indoor', 'aquarium', 'winter', ['Warm socks', 'Gloves']],

  // Insects: outdoors and nature
  ['blossom-picnic', 'Cherry blossom picnic', '🌸', 1, 150, 'outdoor', 'insects', 'spring', ['Blanket', 'Tea', 'Something sweet']],
  ['stargazing', 'Stargazing night', '🔭', 0, 120, 'outdoor', 'insects', 'winter', ['Blanket', 'Thermos', 'Star map app']],
  ['waterfall-walk', 'Bush walk to a waterfall', '🥾', 0, 180, 'outdoor', 'insects', null, ['Water', 'Scroggin', 'Good shoes']],
  ['sunrise-hike', 'Sunrise hike', '🌄', 0, 180, 'outdoor', 'insects', null, ['Head torch', 'Coffee in a flask']],
  ['botanic-garden', 'Botanic garden stroll', '🌷', 0, 90, 'outdoor', 'insects', 'spring', []],
  ['bike-bakery', 'Bike ride to a bakery', '🚲', 1, 150, 'outdoor', 'insects', null, ['Bikes', 'Helmets', 'Appetite']],
  ['strawberries', 'Strawberry picking', '🍓', 1, 120, 'outdoor', 'insects', 'summer', ['Punnets', 'Cream for after']],
  ['leaf-walk', 'Autumn leaf walk', '🍂', 0, 90, 'outdoor', 'insects', 'autumn', ['Scarf', 'Hot drink']],
  ['mushroom-walk', 'Mushroom spotting walk', '🍄', 0, 150, 'outdoor', 'insects', 'autumn', ['Camera', 'Look, don’t eat!']],
  ['camping', 'Night under canvas', '⛺', 2, 1440, 'outdoor', 'insects', 'summer', ['Tent', 'Marshmallows', 'Torch']],
  ['birdwatching', 'Bird-watching morning', '🐦', 0, 120, 'outdoor', 'insects', null, ['Binoculars', 'Bird guide']],
  ['kite-flying', 'Kite flying', '🪁', 0, 90, 'outdoor', 'insects', 'spring', ['A kite', 'A breezy day']],
  ['lights-walk', 'Hot chocolate & lights walk', '✨', 0, 60, 'outdoor', 'insects', 'winter', ['Hot chocolate', 'Beanies']],

  // Fossils: classics worth repeating
  ['favourite-restaurant', 'Our favourite restaurant', '🍝', 2, 120, 'indoor', 'fossils', null, []],
  ['anniversary-spot', 'Revisit where it started', '💌', 1, 180, 'outdoor', 'fossils', null, ['A story to retell']],
  ['cafe-brunch', 'Brunch at our café', '☕', 1, 90, 'indoor', 'fossils', null, []],
  ['pizza-night', 'Homemade pizza night', '🍕', 1, 120, 'indoor', 'fossils', null, ['Dough', 'Toppings', 'Flour everywhere']],
  ['board-games', 'Board game night', '🎲', 0, 120, 'indoor', 'fossils', null, ['A game', 'Snacks', 'Good sportsmanship']],
  ['blanket-fort', 'Blanket fort movie marathon', '🍿', 0, 240, 'indoor', 'fossils', 'winter', ['Blankets', 'Pillows', 'Popcorn']],
  ['cook-new', 'Cook something new together', '🍳', 1, 120, 'indoor', 'fossils', null, ['A new recipe', 'Ingredients']],
  ['dessert-crawl', 'Dessert crawl', '🍰', 2, 120, 'outdoor', 'fossils', null, ['Three stops', 'Stretchy pants']],
  ['fancy-dinner', 'Dress-up fancy dinner', '🥂', 3, 180, 'indoor', 'fossils', null, ['Booking', 'Best outfits']],
  ['breakfast-bed', 'Breakfast in bed', '🥞', 1, 60, 'indoor', 'fossils', null, ['Tray', 'Pancakes', 'Fresh juice']],
  ['soup-fireside', 'Soup by the fire', '🍲', 1, 120, 'indoor', 'fossils', 'winter', ['Veggies', 'Crusty bread']],
  ['cider-tasting', 'Cider or wine tasting', '🍷', 3, 180, 'outdoor', 'fossils', 'autumn', ['Designated driver or bus']],
  ['spring-market', 'Spring market wander', '🧺', 1, 120, 'outdoor', 'fossils', 'spring', ['Tote bag', 'Cash for treats']],

  // Gallery: arty and cultural
  ['art-gallery', 'Art gallery afternoon', '🖼️', 0, 120, 'indoor', 'gallery', null, []],
  ['live-gig', 'Live gig', '🎸', 2, 180, 'indoor', 'gallery', null, ['Tickets', 'Earplugs']],
  ['pottery', 'Pottery class', '🏺', 3, 150, 'indoor', 'gallery', null, ['Booking', 'Clothes you can get muddy']],
  ['cinema', 'Cinema date', '🎬', 1, 150, 'indoor', 'gallery', null, ['Tickets', 'Choc tops']],
  ['paint-each-other', 'Paint each other', '🎨', 1, 90, 'indoor', 'gallery', null, ['Two canvases', 'Paints', 'No judging']],
  ['museum-day', 'Museum day', '🏛️', 0, 180, 'indoor', 'gallery', null, []],
  ['comedy-show', 'Theatre or comedy show', '🎭', 2, 150, 'indoor', 'gallery', null, ['Tickets']],
  ['outdoor-cinema', 'Outdoor cinema', '📽️', 1, 180, 'outdoor', 'gallery', 'summer', ['Beanbag', 'Bug spray']],
  ['horror-night', 'Horror movie night', '👻', 0, 180, 'indoor', 'gallery', null, ['A scary film', 'Someone to hide behind']],
  ['bookshop', 'Bookshop date: pick for each other', '📚', 1, 90, 'indoor', 'gallery', null, ['A small budget each']],
  ['karaoke', 'Karaoke night', '🎤', 2, 150, 'indoor', 'gallery', null, ['A duet in mind']],
  ['gingerbread', 'Build a gingerbread house', '🏠', 1, 120, 'indoor', 'gallery', 'winter', ['Gingerbread', 'Icing', 'Lollies']],
]

export const starterRecipes = (): Recipe[] =>
  STARTERS.map(([id, title, icon, cost, durationMins, setting, category, season, materials]) => ({
    id,
    title,
    icon,
    cost,
    durationMins,
    setting,
    category,
    ...(season ? { season } : {}),
    materials,
    source: 'starter',
  }))

export const COST_LABEL: Record<Cost, string> = { 0: 'Free', 1: '$', 2: '$$', 3: '$$$' }

export function durationLabel(mins: number): string {
  if (mins >= 720) return 'Overnight'
  if (mins < 60) return `${mins} min`
  const h = mins / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${h === 1 ? '' : 's'}`
}

/** Icons offered when crafting a new recipe. */
export const RECIPE_ICONS = [
  '💛', '🌸', '🌊', '🧺', '🍝', '🍕', '☕', '🍺', '🍻', '🍰', '🎬', '🎸', '🎨', '📚',
  '🥾', '🚲', '🔭', '⛺', '🎲', '🍳', '🎤', '🛶', '🏖️', '🌻', '🍂', '❄️',
]
