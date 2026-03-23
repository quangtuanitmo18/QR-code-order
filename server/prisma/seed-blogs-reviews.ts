/**
 * Additive seed script — adds 10 rich blog posts + 20 diverse reviews.
 * Run: npx ts-node prisma/seed-blogs-reviews.ts
 * Does NOT wipe existing data.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Resolve authorId (Admin) and guestId (first guest) ──────────
  const admin = await prisma.account.findFirst({ where: { role: 'Owner' } })
  if (!admin) throw new Error('No Owner account found — run seed.ts first')

  const employee1 = await prisma.account.findFirst({
    where: { role: 'Employee' },
    orderBy: { id: 'asc' }
  })

  const guests = await prisma.guest.findMany({ orderBy: { id: 'asc' }, take: 5 })
  if (guests.length === 0) throw new Error('No guests found — run seed.ts first')

  // ─────────────────────────────────────────────────────────────────
  // 10 BLOG POSTS — each with ~2 pages of Markdown content
  // ─────────────────────────────────────────────────────────────────
  console.log('Seeding Blog Posts...')

  const blogs = [
    {
      title: "The Art of Pho: How We Perfect Vietnam's Most Iconic Bowl",
      slug: 'art-of-pho-perfect-vietnams-iconic-bowl',
      excerpt:
        "Every bowl of pho at Big Boy starts 18 hours before you order it. Here's the story behind our bone broth.",
      category: 'Behind the Kitchen',
      tags: JSON.stringify(['pho', 'vietnamese-cuisine', 'chef-notes', 'cooking']),
      featured: true,
      viewCount: 2841,
      featuredImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      content: `# The Art of Pho: How We Perfect Vietnam's Most Iconic Bowl

Pho is deceptively simple. A bowl of noodles, a clear broth, some meat, a scattering of herbs. But behind that simplicity is one of the most time-intensive, technique-dependent dishes in Vietnamese cuisine — and one we've spent years perfecting.

## The 18-Hour Broth

It starts the night before. At 8 PM each evening, Chef Minh's team loads our stock pots with:
- 12 kg of charred yellow onion and ginger (the char is non-negotiable — it gives that deep roasted sweetness)
- 8 kg of beef knuckle bones, blanched twice
- 2 kg of oxtail
- A spice parcel: star anise, cinnamon stick, cardamom pods, cloves, coriander seeds — toasted dry until fragrant

The water comes to a hard boil once, then falls to the lowest possible simmer for 18 hours. We skim relentlessly in the first two hours. The difference between a cloudy pho and a crystal-clear one is patience and skimming — there are no shortcuts.

> "The broth should taste like both nothing and everything at once. You shouldn't be able to name a single spice, but you should feel all of them." — Chef Minh Nguyễn

## Sourcing the Bones

We partner with Phú Quý Farm in Hòa Vang district, 25 km outside Da Nang. The bones arrive fresh every morning, never frozen. Frozen bones release more fat and less collagen — you get a greasier, weaker broth.

The knuckles give us gelatin (that silky, lip-coating texture). The oxtail gives depth. We add narrow marrow bones exactly 4 hours before the broth is done — long enough for richness, not so long they go bitter.

## Noodles, Rice Paper, and the Finishing Touch

We use fresh pho noodles from a third-generation noodle maker in the Hải Châu market. Dried noodles are fine for home cooking, but fresh noodles have a different texture — silkier, with more bite.

The meat: we offer rare beef (thịt tái), which is sliced paper-thin and laid raw in the bowl. The moment the boiling broth hits, it cooks to just-pink perfection. We also offer well-done brisket (gầu chín), slow-poached for 4 hours in a separate pot.

### The Table Setup

We provide:
- Kalian lime (not regular lime — the acid profile is different)
- Thai basil, not Italian
- Bean sprouts, blanched in the kitchen so they're safe but still have crunch
- Hoisin and sriracha on the side — purists will tell you these don't belong in pho, but we're not here to judge

## Why Pho at Big Boy Is Different

We don't use MSG. That's not a marketing claim — it's a constraint. Our chef believes MSG shortcuts the work of building flavor. We add fish sauce at the end, 30 ml per 10 liters, for salinity and umami. The sweetness comes from the caramelized onion and a single piece of rock sugar, no more.

We also serve our pho slightly hotter than most places. This matters: the rare beef needs the temperature to cook, and the herbs wilt more appealingly in a truly hot bowl.

---

## A Personal Note from Chef Minh

My mother made pho every Tết. She rose at 3 AM to start the broth. I've been chasing that memory for 20 years. Every day our kitchen produces 80–100 bowls, and every day I taste the first one that comes off the line.

Some days it's right. Some days we adjust. The goal is always the same: to make you feel, for 20 minutes, like you're sitting in someone's home.

Come try it — we think you'll taste the difference.

*Available daily from 7:00 AM until we run out — usually around 11:00 AM. We make a limited batch on purpose.*
`
    },
    {
      title: 'Farm to Table in Da Nang: Meet Our 35 Local Suppliers',
      slug: 'farm-to-table-da-nang-local-suppliers',
      excerpt: 'A behind-the-scenes look at how Big Boy sources 90% of its ingredients within 50 km of Da Nang.',
      category: 'Sourcing & Sustainability',
      tags: JSON.stringify(['local-sourcing', 'sustainability', 'da-nang', 'farms']),
      featured: true,
      viewCount: 1644,
      featuredImage: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      content: `# Farm to Table in Da Nang: Meet Our 35 Local Suppliers

When guests order a dish at Big Boy, they're participating in a supply chain that stretches no more than 50 km from our kitchen. 90% of our ingredients are sourced from Da Nang and the surrounding provinces of Quảng Nam and Thừa Thiên Huế.

This wasn't always the plan. When we opened in 2010, it was simply cheaper to source locally. What we didn't expect was how much it would improve the food.

## Why Local Matters (For Real)

The standard argument is freshness. True, but incomplete. Local sourcing also means:

**Variety control.** We can ask Farmer Bình in Hòa Vang to plant a specific heirloom tomato variety we want. We can't do that with a distributor.

**Traceability.** We know every farm that supplies us by name. If there's a food safety concern, we can trace it to the source in under an hour.

**Seasonality as a feature.** Our menu changes slightly month to month based on what's available. Some regulars track which dishes disappear in winter and return in spring.

## The Producers We're Proud Of

### Phú Quý Farm — Hòa Vang
Our primary meat supplier. Third-generation cattle farmers, pasture-raised on 12 hectares. They supply our beef bones for pho broth and our ribeye steaks. Chef Minh visits every quarter.

### Bà Nà Organic Greens — Bà Nà Hills foothills
Cool-climate vegetables: romaine, butter lettuce, baby spinach, herbs. The elevation means natural pest management — very little input is needed. They deliver three times per week.

### Cô Linh's Herb Garden — Hải Châu market
A single elderly woman who grows six varieties of mint, Thai basil, perilla, and lemongrass in her rooftop garden. We use her herbs in pho, salads, and our specialty cocktails. She delivers every morning at 6 AM.

### Hội An Seafood Cooperative
Fresh river shrimp, saltwater fish, and squid from the Thu Bồn River delta. Same-day catch, delivered by 9 AM. We use this for our Pad Thai shrimp, grilled seafood platters, and Shrimp Cocktail.

### Tiên Sa Port Vessels
For larger seafood orders, we work directly with two fishing vessels docked at Tiên Sa port. When the catch is good, we get first pick. This is how we occasionally offer fresh yellowfin tuna on the specials board.

---

## The Challenge of Going Local

It's not always easy. Local suppliers can't always guarantee volume. Harvests fail. Prices fluctuate with weather. We've had weeks where a storm meant no seafood for two days, or a heatwave reduced the greens output by 40%.

The answer is flexibility. Our kitchen is designed to adapt. When volume drops, we run a smaller menu. When there's an unexpected surplus — say, an oversized herb harvest — we create a special around it.

We also pre-purchase some crops. For example, we'll often buy a farmer's entire sweet potato crop in August, knowing we'll use it through November. This gives the farmer security and us a guaranteed supply.

---

## What's Next

We're piloting a rooftop herb garden on our own building. If it works, we'll be able to grow mint, chilies, and Vietnamese coriander on-site year-round. A small step, but symbolically important.

We're also working with two other Da Nang restaurants to create a collective purchasing agreement with Bà Nà Organic Greens — which should help stabilize pricing for all three of us and give the farm the volume they need to expand.

*Want to know where a specific ingredient comes from? Ask any of our staff — they all know our suppliers by name.*
`
    },
    {
      title: 'How We Built a Zero-Waste Kitchen (And What We Learned)',
      slug: 'zero-waste-kitchen-lessons-learned',
      excerpt:
        "Last year we composted 98% of our food waste. Here's the system we built, and the mistakes we made along the way.",
      category: 'Sourcing & Sustainability',
      tags: JSON.stringify(['zero-waste', 'sustainability', 'environment', 'kitchen-operations']),
      featured: false,
      viewCount: 987,
      featuredImage: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=800&q=80',
      content: `# How We Built a Zero-Waste Kitchen (And What We Learned)

In 2022, we started tracking every kilogram of food that left our kitchen as waste. The results were embarrassing: 47 kg per week. That's nearly 2.5 tonnes per year, mostly vegetable trim, stale bread, and unusable seafood pieces.

Today that number is 1.2 kg per week — a 97% reduction. Here's how.

## Step 1: Measure First, Optimize Second

We started with a simple practice: every food item going to the bin went through a kitchen scale first, logged over 4 weeks. This gave us our baseline.

The top three waste categories were:
1. **Vegetable trim** (45%) — carrot peels, herb stems, onion skins
2. **Bread ends** (22%) — baguette ends, day-old garlic bread
3. **Seafood offcuts** (18%) — shrimp heads and shells, fish collars

Once we knew what we were wasting, the solutions became obvious.

## Step 2: Whole-Ingredient Cooking

We began designing dishes around the whole ingredient, not just the choice cuts.

**Vegetable trims** became the base for our house vegetable broth, used in risotto and soups. Carrot tops became chimichurri. Herb stems went into stocks.

**Bread ends** — we make croutons for salads and pangrattato for pasta dishes. What's left goes to a local animal shelter's rabbit enclosure via a community arrangement.

**Seafood offcuts** — shrimp heads are sautéed in oil to create the base for our bisque sauce. Fish collars are now on our specials menu (roasted collar of the day) — it's become one of our most talked-about dishes.

## Step 3: Daily Specials as a Surplus Valve

Every morning, Chef Minh walks the cold storage and identifies anything that needs to move within 24 hours. A daily special is built around that ingredient. It's not a dump menu — every special gets the same care as a regular dish.

This practice has two effects: it reduces waste AND it's created some of our most interesting seasonal dishes. Some have become permanent menu items.

## Step 4: Composting Partnership

What legitimately can't be used (coffee grounds, eggshells, citrus rinds after juicing) goes to a composting partnership with Bà Nà Organic Greens. Twice per week, they collect our organic waste in sealed containers and return it as compost that feeds the very vegetables we use. A genuinely circular system.

---

## What We Got Wrong

We're not perfect. Some lessons came from failures:

**Over-par stocking.** In our first year, we frequently over-ordered to avoid running out. The waste this caused was worse than occasionally running low. We now use a stricter 2-day buffer system.

**Specials nobody ordered.** We once created a dish around excess turbot collar that was technically excellent but didn't sell. We had to compost it anyway. The lesson: a surplus special needs to be appealing, not just clever.

**Staff engagement.** The program only works if every team member buys in. We had resistance early — extra logging felt like more work. The turning point was showing the team the actual numbers and connecting the waste reduction to lower costs, which allowed us to raise wages.

---

## The Numbers

| Year | Weekly food waste | % of prep weight |
|------|------------------|-----------------|
| 2021 | 47 kg | 12.4% |
| 2022 | 18 kg | 4.7% |
| 2023 | 4.2 kg | 1.1% |
| 2024 | 1.2 kg | 0.3% |

We're proud of this progress. We're also aware it took four years to get here.

*Interested in visiting our kitchen? We run monthly open kitchen sessions for restaurant professionals. Email kitchen@bigboy.vn.*
`
    },
    {
      title: "5 Vietnamese Dishes You Didn't Know Were Seasonal",
      slug: '5-vietnamese-dishes-seasonal-guide',
      excerpt:
        'Mango salad in July, bánh cuốn in October, sầu riêng dishes in June — Vietnamese cuisine is deeply tied to agricultural seasons.',
      category: 'Food Education',
      tags: JSON.stringify(['vietnamese-food', 'seasonal', 'menu', 'education']),
      featured: false,
      viewCount: 3211,
      featuredImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      content: `# 5 Vietnamese Dishes You Didn't Know Were Seasonal

In most modern restaurants, you can order pretty much anything on the menu year-round. Strawberry dessert in January. Asparagus in August. Convenience and consistency have decoupled food from its natural cycles.

At Big Boy, we push back on this. We keep a core menu that's always available, but we also track agricultural seasons and let them shape what we emphasize. Here are five Vietnamese dishes that are best — or only available — at specific times of year.

## 1. Gỏi Xoài (Green Mango Salad) — May to August

Mango season in the Quảng Nam region peaks in June and July. Thai green mango is the variety we want — sour, crunchy, unripe. The dish is assembled with thin slices of green mango, dried shrimp, roasted peanuts, crispy shallots, and a fish sauce dressing with Thai chilies.

In winter, you can technically make this with less-ripe regular mango, but the texture and acidity are wrong. The authentic crunch and sourness only exist in the summer variety.

**On our menu:** June–August, in the specials section. If you see it, order it — it's gone fast.

## 2. Bún Bò Huế — Best in the Cooler Months

This spicy beef noodle soup from Huế is eaten year-round, but its bold, warming flavors suit the cooler months (November–February for Central Vietnam). The broth, built on lemongrass, annatto oil, and fermented shrimp paste, feels exactly right on a cool evening.

In summer, guests tend to find it heavy. In January, regulars sometimes order it twice in a week.

**Note:** We source the pork blood cubes and pork knuckle for this dish from our Hội An supplier. When supply is limited, so are our bowls.

## 3. Bánh Cuốn — Winter Breakfast

Steamed rice rolls filled with minced pork and wood ear mushrooms. The rolls are paper-thin, which requires very high humidity in the air to set properly without tearing. Da Nang's wet season (October–December) is perfect — low barometric pressure, high humidity.

Trying to make bánh cuốn on a hot, dry summer day in an non-air-conditioned kitchen is a lesson in frustration. The wraps crack and dry before you can fill them.

**On our menu:** October–December, weekend mornings only. Sold out by 10:30 AM most days.

## 4. Chè Ba Màu — Summer Dessert

The classic Vietnamese three-color dessert: red kidney beans, green pandan jelly, and yellow mung bean paste, layered over crushed ice and drizzled with coconut milk.

It's available year-round in city dessert shops, but it's genuinely best in the heat of summer (April–August) when you need something cold and sweet to survive the afternoon. In cool weather it feels slightly out of place.

We make our coconut milk from scratch — blended fresh coconut flesh from Quảng Ngãi, not canned.

## 5. Nem Lụi (Grilled Lemongrass Pork Skewers) — Year-Round But Best in Dry Season

Nem lụi are grilled over charcoal, and charcoal grilling requires dry weather and consistent airflow. Our kitchen grill works year-round, but the experience of eating nem lụi is tied to outdoor dining — and our outdoor seating is best in the dry season (February–August).

We serve these with rice paper, green banana, star fruit, cucumber, and a peanut-sesame dipping sauce. The ritual of wrapping each piece yourself is part of the dish.

---

## Why We Do This

Chef Minh grew up eating food that was defined by what was available, not what was convenient. He believes seasonal eating produces better flavors and creates a connection between guest and landscape that a static menu can't replicate.

We also believe it's more honest. A tomato in January is not the same as a tomato in July. Pretending otherwise, through artificial ripening and long supply chains, doesn't serve the guest.

*Ask your server what's seasonal today. We keep our specials board current and our staff briefed on what's worth ordering right now.*
`
    },
    {
      title: 'QR Ordering: How We Designed a System Guests Actually Like',
      slug: 'qr-ordering-system-design-guest-experience',
      excerpt:
        "When we rolled out QR code ordering, 30% of guests initially refused to use it. Here's how we redesigned the experience until they did.",
      category: 'Technology & Experience',
      tags: JSON.stringify(['qr-ordering', 'technology', 'ux', 'restaurant-innovation']),
      featured: true,
      viewCount: 4102,
      featuredImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      content: `# QR Ordering: How We Designed a System Guests Actually Like

We launched our QR ordering system in March 2022. It went badly.

In our first week, 30% of guests pushed the QR code away and asked for a paper menu. Older guests found the interface confusing. Families with young children found it awkward to share one screen. Some guests simply didn't trust it.

By month three, adoption was above 85%. By month eight, guests were asking us why they couldn't order for friends at other tables using the same QR code.

Here's what we changed.

## The First Mistake: Removing Paper Menus Too Soon

Our initial plan was to go fully QR from day one. We printed minimal paper menus "just in case." Within two days, we ran out of paper menus on a busy Saturday night. Chaos.

The lesson: QR ordering is an *addition* to the experience, not a replacement — at least at first. We brought back full paper menus and kept them available without guests having to request them. The pressure to use QR dropped, and paradoxically, more people tried it voluntarily.

## The Second Mistake: Too Many Steps

Our first interface had 7 steps between scanning the QR code and placing an order. We watched guests lose interest at step 3 consistently.

We rebuilt the flow:
1. Scan → land on menu (no account needed, no signup)
2. Tap dish → see photo, description, allergens
3. Add to cart → see cart badge update
4. Review cart → place order

Four steps. The order confirmation animation became our most-commented-on design element — a small success celebration that felt good to trigger.

## The Third Mistake: No Way to Ask Questions

A QR menu can answer "what's in this dish?" but it can't replace a server's judgment when a guest says "I'm allergic to tree nuts — what should I avoid?"

We added a **"Ask a question"** button visible on every dish page. It opens a direct chat with the nearest available staff member via our internal system. Response time target: under 90 seconds.

This single change reduced order abandonment by 22%.

---

## The AI Assistant

In late 2023, we added a conversational AI assistant to the ordering flow. Guests can type (or voice-input) in Vietnamese, English, or Mandarin:

*"What's good for someone who doesn't eat spicy food?"*
*"I want something light, under $5."*
*"Can I get the steak medium-rare?"*

The AI understands context, shows relevant dishes, and can place the order on confirmation. For first-time guests who are overwhelmed by the menu, this is now the most popular entry point.

We use an open-source language model with our menu data embedded as a knowledge base. The AI doesn't hallucinate dishes — it can only recommend and order items that exist on our menu.

---

## What We Learned About Change

Resistance to new technology in restaurants is real, but it's not permanent. Guests are more adaptable than operators assume — you just have to meet them where they are.

The guests who most loudly resisted QR ordering in month one are now the ones who complain if the connection is slow. They've incorporated it into their ritual of being here.

What didn't work: forcing it, removing alternatives before guests were ready, and making the system feel like it was for the restaurant's convenience rather than theirs.

What did work: making it fast, making it fail gracefully (when in doubt, call a human), and celebrating when it went right.

*We're open about our system. If you're a restaurant owner curious about the technology stack we use, reach out to technology@bigboy.vn.*
`
    },
    {
      title: "Pairing Vietnamese Cuisine with Natural Wine: A Sommelier's Guide",
      slug: 'vietnamese-cuisine-natural-wine-pairing-guide',
      excerpt:
        "Natural wine and Vietnamese food have more in common than you'd think. Both rely on fermentation, brightness, and balance.",
      category: 'Food & Drink',
      tags: JSON.stringify(['wine', 'pairing', 'natural-wine', 'drinks']),
      featured: false,
      viewCount: 1876,
      featuredImage: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
      content: `# Pairing Vietnamese Cuisine with Natural Wine: A Sommelier's Guide

Vietnamese food has classically been paired with beer. Bia hơi, Tiger, Saigon — light, cold, carbonated, cutting through the richness. Nothing wrong with that.

But over the last few years, natural wine has become an increasingly interesting pairing partner for Vietnamese cuisine, and we've started curating a small natural wine selection at Big Boy specifically to explore this.

## Why Natural Wine Works

Natural wine is characterized by:
- Low or no sulfite additions (so aromas are wilder and more complex)
- Often pétillant naturel (petnat) or lightly sparkling
- Higher acidity from minimal intervention
- Frequent orange wine production (skin-contact whites)

Vietnamese cuisine is characterized by:
- Bright, acidic components (lime, tamarind, vinegar)
- Fermented complexity (fish sauce, shrimp paste, miso-adjacent flavors)
- Fresh herbal counter-notes (basil, cilantro, perilla)
- Fat from coconut milk, pork, and fried elements

The matching principle: acidity with acidity, fermented complexity with fermented complexity, brightness with brightness.

## Our Current Pairings

### Pad Thai ↔ Pétillant Naturel from the Loire

The sweetness of the tamarind, the nuttiness of the peanuts, and the eggy richness — a Muscat de Rivesaltes petnat, slightly sweet and wildly effervescent, cuts through all of this while matching the aromatic intensity. Try Domaine Cazes's petnat if you can find it.

**Alternative:** A dry unfiltered Txakolina from the Basque country. The almost saline salinity echoes the fish sauce.

### Chicken Tikka Masala ↔ Orange Wine

The tomato-cream sauce and warming spice of the masala need something with texture and tannin, but reds tend to overwhelm the complexity. An orange wine — skin-contact Trebbiano or even a Georgian Rkatsiteli Amber — has enough tannin from the grape skins to stand up to rendered fat and cream, while remaining bright and aromatic.

### Beef Noodle Soup (Pho) ↔ Beaujolais Gamay

This one surprised us. The delicate, clear, aromatic pho broth is killed by a bold Cabernet. But a light Gamay — especially from Fleurie or Chiroubles — matches the broth's transparency with its own fruit clarity. The carbonic maceration process used in many Beaujolais makes them refreshing without being simple.

### Tiramisu ↔ Vin Santo

For dessert, we've abandoned the standard rule of matching sweetness level. Vin Santo from Tuscany — amber, oxidative, nutty, with raisin and coffee notes — isn't as sweet as the tiramisu, but the flavor harmony is extraordinary. Coffee dessert, coffee-adjacent wine. Works every time.

---

## What to Order at Big Boy (Right Now)

We're currently offering:
- **Cruse Wine Co. Piquette** — California, ridiculously food-friendly, pairs with anything, $6 a glass
- **Testalonga El Bandito** — South African skin-contact Chenin Blanc, excellent with seafood and salads
- **La Bohème Cuvée Violette** — Italian Dolcetto, earthy, perfect with our BBQ ribs

We rotate our wine selection monthly based on what we can source from natural wine importers in Hồ Chí Minh City.

*Ask for the wine card when you sit down. We add tasting notes and pairing suggestions to each entry. Our staff can walk you through options even if wine isn't usually your thing.*
`
    },
    {
      title: 'Our New Dietary Labels: Navigating the Menu with Allergies and Preferences',
      slug: 'dietary-labels-allergy-menu-navigation',
      excerpt:
        "We've redesigned how we communicate allergens and dietary options — here's what each label means and how our kitchen staff are trained.",
      category: 'Guest Experience',
      tags: JSON.stringify(['allergens', 'dietary', 'vegetarian', 'gluten-free', 'menu']),
      featured: false,
      viewCount: 1543,
      featuredImage: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=800&q=80',
      content: `# Our New Dietary Labels: Navigating the Menu with Allergies and Preferences

When we redesigned our menu in 2024, we did something simple but long overdue: we moved allergen information from the fine print at the bottom of the menu to directly next to each dish.

This came after a guest experience that we're not proud of. A guest requested a gluten-free option and was told by a well-meaning staff member that the Pad Thai was safe. It isn't — the soy sauce contains wheat. The guest had a mild reaction and was understandably upset.

We overhauled our labeling, training, and kitchen protocols as a result. Here's what changed.

## The New Label System

Each dish on our menu now carries relevant badges:

| Label | What It Means |
|-------|---------------|
| 🟢 **VG** | Fully vegan — no animal products |
| 🟡 **VE** | Vegetarian — may contain dairy or eggs |
| 🔵 **GF** | Gluten-free as prepared |
| 🟠 **GF*** | Can be made gluten-free on request |
| 🔴 **Contains:** | Followed by specific allergen list |

We list the 14 major EU allergens for all dishes, even those without obvious allergens. "None" means none — we don't leave it blank.

## What "Can Be Made Gluten-Free" Actually Means

This is important. When a dish carries **GF***, our kitchen:
1. Uses a dedicated set of utensils that are stored separately and labeled
2. Prepares on a section of the grill/prep surface cleaned between uses
3. Substitutes tamari (gluten-free soy sauce) for regular soy where applicable
4. Notes the modification in our kitchen display system

We cannot guarantee zero cross-contamination for guests with celiac disease, as we do prepare gluten-containing dishes in the same kitchen. We communicate this clearly to guests who state a medical need.

## Staff Training

Every new staff member completes allergen training during their first week:
- Which dishes contain which allergens
- How to communicate uncertainty (the right answer is "let me check" — not a guess)
- How to flag an allergy in our ordering system so the kitchen is alerted
- Emergency protocols if a guest reports a reaction

We also run a quarterly allergen refresher when the menu updates. Staff who fail the assessment don't serve until they pass.

---

## Vegetarian and Vegan Options

We're not a vegetarian restaurant, but we've significantly expanded plant-based options in the last two years:

**Always available (Vegan):**
- Garlic Fried Rice (hold the egg)
- Steamed Vegetables
- Vegetarian Pho (ask for it — broth made with mushrooms and charred ginger)
- Side Salad

**Vegetarian:**
- Margherita Pizza
- Vegetarian Lasagna
- Mushroom Risotto
- Bruschetta

**Coming soon:** We're trialing a jackfruit rendang as a plant-based main. Watch the specials board.

---

## How to Tell Us About Your Needs

The best approach is to mention any allergy or dietary restriction when you scan the QR code and start your order. Our system flags it to the kitchen. You can also tell your server — they'll update the ticket.

If you're using the AI assistant to order, tell it your restrictions at the start of the conversation: *"I'm lactose intolerant — what can I eat here?"* It will filter recommendations accordingly.

*We take allergen requirements seriously. If you have a severe allergy, please speak with a manager before ordering so we can walk you through options and risks personally.*
`
    },
    {
      title: 'The Big Boy Story: From 4 Tables to 120 Seats in 15 Years',
      slug: 'big-boy-restaurant-story-15-years',
      excerpt:
        "Our founder's account of what it took to build a restaurant that survived two economic downturns, a pandemic, and 15 years of Da Nang's changing food scene.",
      category: 'About Us',
      tags: JSON.stringify(['founding-story', 'history', 'chef-minh', 'da-nang']),
      featured: true,
      viewCount: 5882,
      featuredImage: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      content: `# The Big Boy Story: From 4 Tables to 120 Seats in 15 Years

*Written by Chef Minh Nguyễn, Founder*

I want to tell you the real story — not the polished version we put on our About page.

## 2010: Why I Came Back

I spent most of my twenties working in kitchens in Hội An, Hà Nội, and eventually two years in Japan doing apprentice work in a kaiseki restaurant. I was 32, had some savings, and was tired of being someone else's chef.

I came back to Da Nang because my mother was getting older, because I missed the coast, and because I believed the city was about to change. It was right before the tourist boom. Real estate was cheap. The food scene barely existed — there were a few good bánh mì spots and some street food, but nothing that felt like a real restaurant.

I found a narrow shophouse on a side street near Hải Châu market. Wooden tables and chairs that I bought secondhand. One gas line, three burners, and a prep table my brother built out of reclaimed steel.

We opened on a Tuesday in March 2010. We had four tables, a menu of eight dishes, and enough money to survive three months without turning a profit.

## The First Year

The first six months were quiet. We built a base of market regulars — vendors who wanted a sit-down lunch that wasn't street food. The discovery was slow.

Then a backpacker hostel opened two streets away. Their guests found us. Word traveled on travel forums. By late 2010 we were turning away customers on weekends and I had to hire my first assistant.

I made every mistake a first-time restaurateur makes: I kept saying yes to specials I couldn't execute well. I underpaid early staff. I didn't track costs carefully enough. We were profitable, barely, but not sustainable.

## 2013: The First Real Test

Da Nang had a rough year economically in 2013. Tourism slowed, local spending contracted, and three restaurants in our neighborhood closed. I had to let two staff members go, which I hated, and cut the menu from 22 dishes to 14.

What I learned: a leaner menu is better. The dishes we kept were the ones the kitchen could execute consistently and that guests loved most. We never went back to 22 dishes.

We also moved to our current location on Nguyễn Văn Linh that year — three times the size, better foot traffic, and a proper kitchen. The move was terrifying. The rent was double. It was the right decision.

---

## 2020: The Pandemic

I won't pretend it was fine. It wasn't.

We had 38 staff in February 2020. By April we had 12, and those 12 were taking reduced salaries. We pivoted to delivery — which we'd never done — and offered family meal kits. It kept us alive.

I'm most proud of two things from that period: we didn't compromise the food, and we didn't fire everyone we'd built relationships with. The senior team — Lan, Hùng, our floor manager Tuấn — stayed through salary cuts and came back stronger. We owe each other something because of that.

When restrictions lifted in 2021, we reopened with a clear sense of what we were. The pandemic stripped away everything that wasn't essential. What remained was exactly the restaurant I wanted to run.

## 2022–Present: Building the System

Since 2022 we've invested heavily in systems: the QR ordering platform, the AI assistant, supplier partnerships, staff training programs, a proper kitchen display system.

These feel like technology investments, but they're really investments in consistency. The goal has never been to be the newest thing in Da Nang. The goal is to be the place where the food is as good on a Tuesday at 2 PM as it is on a Saturday at 8 PM.

We're at 50 staff now. We served our one-millionth dish sometime in mid-2024 (we tracked it). The kitchen still runs on the same three principles from 2010: fresh ingredients, honest cooking, warm table.

---

## What's Next

I want Big Boy to still be here in 2040. That sounds simple. For a restaurant, it's an enormous ambition.

We're training our sous chef, Hùng, to eventually take over the kitchen. We're documenting recipes and techniques that exist only in our chefs' hands. We're building the supplier relationships to withstand disruption.

And every morning I still taste the first bowl of pho off the line.

Some days it's right. Some days we adjust.

*Thank you for being part of this. Genuinely.*

— Chef Minh Nguyễn, Da Nang 2025
`
    },
    {
      title: 'Da Nang Food Map: 10 Essential Dishes Beyond Big Boy',
      slug: 'da-nang-food-map-essential-dishes',
      excerpt:
        'As locals, we want Da Nang to win. Here are 10 dishes from around the city that every visitor should try — none of them ours.',
      category: 'City Guide',
      tags: JSON.stringify(['da-nang', 'food-guide', 'local-tips', 'city-guide']),
      featured: false,
      viewCount: 7413,
      featuredImage: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=800&q=80',
      content: `# Da Nang Food Map: 10 Essential Dishes Beyond Big Boy

We love our food. But we also love this city, and we want visitors to see all of it.

This is our honest, un-sponsored guide to dishes you should eat in Da Nang — not at Big Boy, but at the places that have been making these things for decades.

## 1. Mì Quảng — Bà Vị, 166 Lê Đình Dương

The Da Nang noodle. Wider than pho, cooked in a shallow broth that's been reduced to a near-paste. Served with turmeric-marinated pork, shrimp, peanuts, and rice crackers. Bà Vị has been running this spot for over 40 years and it shows.

**Order:** The mixed version with both pork and shrimp. One bowl. Eat slowly.
**Hours:** 6 AM–11 AM. Gone after that.

## 2. Bánh Tráng Thịt Heo — Any Hội An Market Vendor

Rice paper wraps assembled at the table with boiled pork belly, shrimp, herbs, green banana, and a fermented shrimp paste called mắm nêm. This is hands-on eating — you build each wrap yourself. The assembly IS the dish.

**Best spot:** The market alley behind the Hội An old town (30 min drive — worth it).

## 3. Nem Nướng — Trần Restaurant, near Dragon Bridge

Grilled pork sausages wrapped in rice paper with local herbs. The sausage is slightly sweet, charcoal-grilled, and dipped in a peanut-sesame sauce. Simple perfection.

## 4. Bánh Mì Bà Lan — 45 Điện Biên Phủ

The best bánh mì this side of Hội An. The bread is baked on-site, comes out at 6 AM and 2 PM. Fillings: house pâté, head cheese, pickled daikon, cucumber, cilantro, and a swipe of butter.

**Avoid:** Any filling that involves melted cheese. You're in Vietnam.
**Go early:** The afternoon batch runs out by 3:30 PM.

## 5. Chè Bắp — Near Con Market

Sweet corn dessert in coconut milk. Sounds simple, tastes like summer. Made from fresh local corn and served warm. The contrast between sweet coconut milk and slightly starchy corn is one of the great small pleasures.

## 6. Bánh Xèo — Madame Khánh (40 minutes, Hội An)

The sizzling crepe — bánh xèo — exists in Da Nang but the best version requires a 40-minute drive to Hội An. Madame Khánh's version has been running 50 years. The crepe is crispy, stuffed with pork and shrimp and beansprouts, and wrapped in mustard greens and rice paper.

**This dish requires the drive.** No equivalent in the city.

## 7. Bún Chả Cá — Bà Hoa, 37 Nguyễn Hữu Tín

Fishcake noodle soup. The broth is blond, delicate, and fishy in the best possible way. The fishcakes are rough-textured and springy. Add shrimp paste at the table if you want umami. This is a breakfast dish but we eat it at 10 AM when the morning rush has died down.

## 8. Cháo Lươn — Various street stalls near Hàn Market

Eel congee. This one is for the adventurous. Slow-cooked white rice porridge with sliced freshwater eel, crispy shallots, and fresh ginger. One of the most warming dishes in Vietnamese cuisine. Usually served at night from small street carts.

## 9. Soft Shell Crab — Tiên Sa Fishing Port Area

Buy it from vendors near the port, fried fresh, eaten standing up with lime and salt. No restaurant required. This is more of an experience than a restaurant dish — watch the fishing boats, eat crab, argue with friends about which sauce is better.

## 10. Bánh Đập + Mít Trộn — Village near Marble Mountains

Broken rice crackers served with bánh ướt (soft rice paper) and raw jackfruit salad. A combination dish unique to Central Vietnam. You crack the rice cracker, layer on the soft rice paper, add jackfruit salad, and eat with fermented shrimp dip. Best version: Quán Bà Ráng in the Ngũ Hành Sơn district.

---

## How to Use This List

Da Nang is a walkable eating city. Everything in Hải Châu district is within 10 minutes of everything else. The Dragon Bridge area — eat mì Quảng for breakfast, walk to Han Market for soft shell crab, end at our place for dinner. That's a perfect day.

*We update this list annually. If you find something exceptional that should be on here, email us at hello@bigboy.vn — we take food tips seriously.*
`
    },
    {
      title: "Training the Next Generation: Big Boy's Kitchen Apprenticeship Program",
      slug: 'kitchen-apprenticeship-program-training',
      excerpt:
        "We run a paid 12-month kitchen apprenticeship for culinary school graduates. Here's what it covers and why we built it this way.",
      category: 'Team & Culture',
      tags: JSON.stringify(['team', 'apprenticeship', 'training', 'hiring', 'culture']),
      featured: false,
      viewCount: 892,
      featuredImage: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
      content: `# Training the Next Generation: Big Boy's Kitchen Apprenticeship Program

The Vietnamese restaurant industry has a staffing problem. Culinary schools produce graduates who can ace classroom theory but have never worked a busy Friday service. Restaurants hire them, discover the gap, and either invest months in training or give up and hire experienced staff at higher cost.

We decided to solve this ourselves.

## The Program

In 2021, we launched a 12-month paid kitchen apprenticeship for culinary school graduates. We take 3 apprentices per year. They rotate through every station, work alongside senior chefs, and complete structured skills assessments each month.

### Month 1–3: Foundation
- Mise en place discipline (the craft of organization)
- Knife skills — certified to our standards before touching service
- Stock production (pho broth, vegetable stock, bisque base)
- Ingredient identification — visiting our suppliers directly

### Month 4–6: Cold Station
- Salads, cold appetizers, dessert plating
- Sauce work and vinaigrette composition
- Understanding flavor balance without heat

### Month 7–9: Hot Station
- Grill, sauté, wok work
- Service pace — executing under pressure
- Waste reduction and quantity management

### Month 10–12: Senior Support
- Shadowing Chef Minh and Chef Hùng
- Running a station independently during quieter services
- Contributing to menu development discussions

At the end of 12 months, we make a hiring decision. In our first three cohorts, we've retained 7 of 9 graduates.

---

## Pay and Conditions

Apprentices are paid 75% of entry-level kitchen wages. This is deliberately below market — the trade is structured training time that they couldn't get elsewhere.

We also provide:
- One hot meal per shift
- Formal feedback meeting monthly
- Access to our library of culinary books and recorded technique sessions
- An annual food budget for them to eat at other restaurants (paid expenses, treated as professional development)

---

## Why We Do It

Partly selfishness: trained apprentices who succeed become loyal team members who understand exactly how our kitchen works.

Partly community: Da Nang has a culinary scene that's growing fast. We want more skilled chefs in this city, even if some of them go on to open competing restaurants.

And partly because Chef Minh remembers being 23 and having no one invest in him properly. He's committed to not being that boss.

---

## What Good Looks Like

Our current sous chef, Hùng, joined as a second-year apprentice in 2018. He was exceptionally skilled but raw — great palate, no service discipline. Over two years he developed into the most reliable cook in the kitchen. He now runs Tuesday–Thursday service independently.

He's starting to develop menu items of his own. When those dishes appear on our specials board, they're labeled with his name.

That's the goal. Not just to train technicians — to develop chefs who understand why the food is the way it is and can continue it, or evolve it, when we eventually step back.

---

## Apply

We accept applications August–October for a January start.

Requirements:
- Completed or near-complete culinary school qualification
- Available to commit to the full 12 months
- Willing to work all stations, including early morning prep

Send a short letter explaining why you want to be here (not a generic letter — why specifically here) to kitchen@bigboy.vn. We read every application personally.

*No experience necessary. Curiosity required.*
`
    }
  ]

  for (const blog of blogs) {
    await prisma.blogPost.upsert({
      where: { slug: blog.slug },
      update: {
        featuredImage: blog.featuredImage,
        content: blog.content,
        tags: blog.tags
      },
      create: {
        ...blog,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
      }
    })
    console.log(`  ✓ Blog: ${blog.title.slice(0, 50)}...`)
  }

  // ─────────────────────────────────────────────────────────────────
  // 20 REVIEWS — diverse ratings, statuses, with replies
  // ─────────────────────────────────────────────────────────────────
  console.log('Seeding Reviews...')

  // We need at least 5 guests — create extras if needed
  const existingGuests = await prisma.guest.findMany({ orderBy: { id: 'asc' }, take: 10 })
  const guestPool: typeof existingGuests = [...existingGuests]

  const guestNames = [
    'Minh Tuấn',
    'Thu Hương',
    'Bảo Long',
    'Phương Linh',
    'Đức Anh',
    'Yuki Tanaka',
    'James Wilson',
    'Maria Santos',
    'Li Wei',
    'Emma Johnson',
    'Park Jimin',
    'Ahmed Hassan',
    'Priya Sharma',
    'Thomas Müller',
    'Sophie Laurent'
  ]

  // Create extra guests if we have fewer than 15
  while (guestPool.length < 15) {
    const name = guestNames[guestPool.length] || `Guest ${guestPool.length + 1}`
    const g = await prisma.guest.create({ data: { name } })
    guestPool.push(g)
  }

  const reviewData = [
    // 5-star reviews (glowing)
    {
      guestIdx: 0,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Absolutely blown away. The pho broth was unlike anything I have tasted outside of a home kitchen in Hanoi. Crystal clear, perfectly seasoned, and the noodles were silky fresh. Staff noticed I was eating alone and chatted with me between courses — that kind of hospitality is rare. Will be back every time I am in Da Nang.',
      status: 'VISIBLE',
      replyContent: 'Thank you so much — this made Chef Minh smile. We hope to see you again soon!'
    },
    {
      guestIdx: 1,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Brought my parents here for their anniversary dinner. The ribeye steak was cooked exactly to how my father requested (medium-rare with charcoal crust), the tiramisu was light and deeply coffee-flavored, and the QR ordering system meant we spent the whole evening talking instead of waiting for menus. One of the best meals we have had in Vietnam.',
      status: 'VISIBLE',
      replyContent:
        'Happy anniversary to your parents! We love hosting family celebrations — thank you for trusting us with this one.'
    },
    {
      guestIdx: 2,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 5,
      comment:
        'I am a food writer and I have eaten at over 200 restaurants in Southeast Asia this year. Big Boy is in my top 10 — possibly top 5. The sourcing commitment is evident in every plate. The mango salad was seasonal and perfect. The matcha mille crepe was technically impressive. And the price point for this quality is almost irresponsible.',
      status: 'VISIBLE',
      replyContent:
        'That means a great deal coming from someone with your experience. We hope you will write about us — we would be honored.'
    },
    {
      guestIdx: 3,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 4,
      comment:
        'As someone with a serious tree nut allergy, eating at a new restaurant is always stressful. The staff here handled it with genuine care — they checked with the kitchen for every dish I was interested in, noted my allergy on the order, and the manager came to confirm before the food arrived. I felt safe, and the food was delicious. The chicken tikka masala is one of the best I have had outside India.',
      status: 'VISIBLE',
      replyContent:
        'Your safety is our absolute priority — we are so glad the team handled this well. Please always mention your allergy when ordering and we will take care of you.'
    },
    {
      guestIdx: 4,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Been coming here monthly for two years. The consistency is what impresses me most — this is not a place that is great the first time and average the second. Every visit the pho is the same, the service is the same, the prices are the same. That predictable excellence is hard to build and harder to maintain. Big Boy has it.',
      status: 'VISIBLE',
      replyContent:
        'Two years of trust — thank you. Consistency is something we work hard at every day. See you next month.'
    },
    // 4-star reviews (positive with constructive notes)
    {
      guestIdx: 5,
      overallRating: 4,
      foodQuality: 5,
      serviceQuality: 3,
      ambiance: 4,
      priceValue: 4,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'The food is genuinely excellent — some of the best Vietnamese food I have eaten in Da Nang. My only hesitation giving 5 stars is the service on a busy Saturday night was stretched. We waited about 20 minutes for our order to arrive even with QR ordering, and nobody checked on us during the wait. Not a dealbreaker, just something to note. The BBQ ribs were phenomenal.',
      status: 'VISIBLE',
      replyContent:
        'Thank you for the honest feedback — Saturday evenings are our busiest and we clearly need to improve check-ins during high volume times. We are working on it. Glad the ribs hit the mark!'
    },
    {
      guestIdx: 6,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 3,
      comment:
        'Really lovely experience overall. The staff remembered my name from a previous visit, which was a wonderful surprise. My only feedback would be that the pricing has moved up noticeably in the last 12 months — the chicken Alfredo used to feel like great value and now it feels just okay for the price. I understand costs have risen everywhere, but it is worth noting.',
      status: 'VISIBLE',
      replyContent:
        'We appreciate the loyalty and the honest note on pricing. You are right that some input costs have risen significantly. We review pricing carefully and try to absorb what we can. Thank you for continuing to come.'
    },
    {
      guestIdx: 7,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 3,
      priceValue: 4,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Great food and solid service. My only comment is the noise level on weekend evenings is quite high — I came for a quiet dinner with a colleague and we had to lean across the table to hear each other during peak time. Might be worth considering acoustic panels or softer music to balance the ambient energy. Would still recommend for lunch.',
      status: 'VISIBLE',
      replyContent: null
    },
    {
      guestIdx: 8,
      overallRating: 4,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 3,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'My third visit and the food continues to be the draw. The beef noodle soup pho is deeply satisfying, the herb quality is noticeably different from other pho places in the city. Deducting a star only because the outdoor seating area could use some shade during the afternoon heat — the sun makes you choose between a good table and a comfortable one.',
      status: 'VISIBLE',
      replyContent: null
    },
    {
      guestIdx: 9,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 5,
      priceValue: 4,
      comment:
        'The ambiance is what sets this place apart from other restaurants at this price point. The space feels designed and considered — warm lighting, interesting seating arrangements, plants that are actually alive. The Pad Thai was exactly right: slightly sweet, nutty, with real flavors. Would return for a date night.',
      status: 'VISIBLE',
      replyContent: null
    },
    // 3-star reviews (mixed)
    {
      guestIdx: 10,
      overallRating: 3,
      foodQuality: 3,
      serviceQuality: 3,
      ambiance: 4,
      priceValue: 2,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Mixed feelings. The atmosphere is great and the ambiance score is deserved. But for a Monday lunch the burger arrived dry and the cheese was not melted through. The fries were excellent. I did not say anything at the time but I should have — I think this might have been an off day. Will give it another try because the reputation seems deserved based on other reviews.',
      status: 'VISIBLE',
      replyContent:
        'We are sorry the burger was not right — that is not our standard and you are right to note it. Please do come back and mention this review to any staff member. Your next burger is on us.'
    },
    {
      guestIdx: 11,
      overallRating: 3,
      foodQuality: 4,
      serviceQuality: 2,
      ambiance: 4,
      priceValue: 3,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'The food was genuinely good when it arrived — the mushroom risotto was particularly well made, creamy and properly seasoned. But we waited 45 minutes with no update, and when we asked the server said they were busy. I get it — restaurants get busy. But a quick check-in or heads-up would have changed the whole experience. The food saved this from a 2-star.',
      status: 'VISIBLE',
      replyContent:
        'A 45-minute wait with no communication is not acceptable and we are sorry this happened. We have addressed this with the team. Thank you for the food feedback too — the risotto is a dish we are proud of and we will make sure the service matches it.'
    },
    {
      guestIdx: 12,
      overallRating: 3,
      foodQuality: 3,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 2,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Visited based on a recommendation. Service was warm and attentive, the space is lovely. The Pad Thai was okay but I found it sweeter than I expected from Vietnamese cuisine — I like mine with more fish sauce-forward lime balance. Subjective taste, so no real criticism, but I would communicate that to guests who are less familiar with Thai noodles expecting a more savory profile.',
      status: 'VISIBLE',
      replyContent:
        'Thank you for the note on Pad Thai balance — this is genuinely useful. You can request "less sweet, more lime" when ordering and we will adjust. Next time try this — we think it will hit the right note for you.'
    },
    {
      guestIdx: 13,
      overallRating: 3,
      foodQuality: 2,
      serviceQuality: 4,
      ambiance: 5,
      priceValue: 2,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'The restaurant is beautiful and the team are lovely people. Unfortunately my salmon fillet arrived overcooked to the point of being dry throughout. I mentioned it and they offered to remake it, which they did flawlessly — the second was perfect. So the execution is there, quality control just needs tightening on busy evenings. Second salmon was a 5-star dish.',
      status: 'VISIBLE',
      replyContent:
        'Thank you for giving us the chance to fix it — and for the honest rating reflecting both experiences. Consistency between first and second cook on the same dish should not differ. We will work on it.'
    },
    // 2-star reviews (critical but fair)
    {
      guestIdx: 14,
      overallRating: 2,
      foodQuality: 2,
      serviceQuality: 2,
      ambiance: 4,
      priceValue: 1,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'I had a disappointing experience and want to give honest feedback because the restaurant has a good reputation. My order arrived 35 minutes late during what seemed like a medium-busy period. The noodles in my mì quảng-style dish were overcooked and sticky. The server did not apologize and seemed defensive when I mentioned it. I hope this was an unusual day, but I cannot recommend based on this visit.',
      status: 'VISIBLE',
      replyContent:
        'Thank you for the direct feedback — this is not the experience we aim to provide. Defensive responses from staff to legitimate concerns are something we take seriously. We would genuinely like to speak with you about this visit. Please email hello@bigboy.vn with your visit date and we will follow up personally.'
    },
    // Pending/draft reviews
    {
      guestIdx: 0,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Just wanted to say the AI ordering assistant is a game changer. It remembered I ordered the pho last time and asked if I wanted it again. That kind of personalization felt genuinely thoughtful, not gimmicky. Also recommended the tiramisu as a pairing and was completely correct. Lovely meal.',
      status: 'HIDDEN',
      replyContent: null
    },
    {
      guestIdx: 1,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 4,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Really pleasant lunch. The side salad was fresher than any salad I have had at a restaurant in Vietnam this trip — clearly locally sourced, dressed at the right moment, not overdressed. Small thing but it tells you something about how carefully this kitchen works.',
      status: 'HIDDEN',
      replyContent: null
    },
    {
      guestIdx: 2,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Came for breakfast and had the beef noodle pho. Left changed. I do not say that lightly — I have eaten pho in Hanoi, in Saigon, in Paris, in Sydney. This is as good as the best I have had. The broth is serious. Please never change this dish.',
      status: 'HIDDEN',
      replyContent: null
    },
    {
      guestIdx: 3,
      overallRating: 4,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 4,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
      ]),
      comment:
        'Birthday dinner for my girlfriend. The staff brought out a small complimentary dessert with a candle without us asking — someone must have noticed the occasion from our conversation. That surprise made the whole evening. The food was also very good; the salmon fillet was cooked correctly and the matcha latte was real matcha, not powder from a bag.',
      status: 'HIDDEN',
      replyContent: null
    },
    {
      guestIdx: 4,
      overallRating: 1,
      foodQuality: 1,
      serviceQuality: 1,
      ambiance: 3,
      priceValue: 1,
      comment:
        'Very disappointing. Had high expectations based on reviews but the reality did not match. Food came out in the wrong order (dessert before mains), one dish was completely forgotten and only appeared when we asked, and the meat in my burger was undercooked pink in the center. The ambiance is nice but that cannot save a meal this poorly executed. Will not return.',
      status: 'HIDDEN',
      replyContent: null
    }
  ]

  let reviewCount = 0
  for (const r of reviewData) {
    const guest = guestPool[r.guestIdx % guestPool.length]
    if (!guest) continue

    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000)

    await prisma.review.create({
      data: {
        guestId: guest.id,
        overallRating: r.overallRating,
        foodQuality: r.foodQuality,
        serviceQuality: r.serviceQuality,
        ambiance: r.ambiance,
        priceValue: r.priceValue,
        comment: r.comment,
        images: r.images ?? undefined,
        status: r.status as 'HIDDEN' | 'VISIBLE' | 'DELETED',
        approvedBy: r.status === 'VISIBLE' ? admin.id : undefined,
        approvedAt: r.status === 'VISIBLE' ? createdAt : undefined,
        replyContent: r.replyContent ?? undefined,
        repliedBy: r.replyContent ? employee1?.id ?? admin.id : undefined,
        repliedAt: r.replyContent ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
        createdAt,
        updatedAt: createdAt
      }
    })
    reviewCount++
    console.log(`  ✓ Review #${reviewCount} (${r.overallRating}★, ${r.status})`)
  }

  console.log(`\n✅ Done! Seeded ${blogs.length} blog posts and ${reviewCount} reviews.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
