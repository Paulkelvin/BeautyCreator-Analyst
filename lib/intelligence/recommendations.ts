import { type AudienceSegment } from "@/lib/types";

export function generateContentRecommendations(topic: string, segments: AudienceSegment[]) {
  const audience = segments.length ? segments.join(", ").replaceAll("_", " ") : "target audience";

  return {
    blogTopics: [
      `The complete guide to ${topic} for ${audience}`,
      `${topic}: mistakes, objections, and what to do instead`,
      `Best ${topic} options by budget, skin type, and use case`
    ],
    seoClusters: [
      `${topic} comparison pages`,
      `${topic} problem and solution pages`,
      `${topic} regional buying guides`
    ],
    videoIdeas: [
      `I tested ${topic} claims against real customer complaints`,
      `${topic} for ${audience}: what creators are not explaining`,
      `Before you buy: ${topic} objections answered`
    ],
    shortFormContent: [
      `3 signs ${topic} advice is not for you`,
      `The ${topic} gap nobody is talking about`,
      `${topic} myth versus reality`
    ],
    faqs: [
      `Who is ${topic} best for?`,
      `What are the most common objections around ${topic}?`,
      `How do you choose ${topic} by region, budget, and experience level?`
    ],
    emailIdeas: [
      `${topic}: the hidden buying objections`,
      `What your audience wishes brands explained about ${topic}`,
      `A practical checklist for choosing ${topic}`
    ],
    leadMagnets: [
      `${topic} decision matrix`,
      `${topic} buyer objection checklist`,
      `${topic} shade, climate, and use-case worksheet`
    ],
    productIdeas: [
      `${topic} curated starter kit`,
      `${topic} consultation or finder`,
      `${topic} comparison database`
    ],
    landingPageIdeas: [
      `${topic} solution page by audience segment`,
      `${topic} regional guide page`,
      `${topic} objection-handling sales page`
    ],
    socialPostIdeas: [
      `Poll: what frustrates you most about ${topic}?`,
      `Carousel: ${topic} by segment`,
      `Comment prompt: your biggest ${topic} question`
    ]
  };
}

export function discoverWhiteSpace(rootTopic: string, modifiers: string[]) {
  const cleaned = modifiers
    .map((modifier) => modifier.trim())
    .filter(Boolean)
    .slice(0, 6);

  const opportunities = new Set<string>();
  for (let depth = 1; depth <= Math.min(cleaned.length, 4); depth += 1) {
    opportunities.add([rootTopic, ...cleaned.slice(0, depth)].join(" "));
  }

  return Array.from(opportunities);
}
