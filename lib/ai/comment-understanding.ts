import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import { env } from "@/lib/env";
import {
  audienceSegments,
  buyingStages,
  intentCategories,
  type CommentUnderstanding,
  type NormalizedComment
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const understandingSchema = z.object({
  intent: z.enum(intentCategories),
  sentiment: z.enum(["negative", "neutral", "positive"]),
  topic: z.string().min(1),
  canonicalTopic: z.string().min(1),
  audienceType: z.enum(audienceSegments),
  buyingStage: z.enum(buyingStages),
  region: z.string().nullable(),
  desiredOutcome: z.string().nullable(),
  objection: z.string().nullable(),
  emotionalIntensity: z.number().min(0).max(100),
  commercialIntent: z.number().min(0).max(100),
  actionability: z.number().min(0).max(100),
  insightDepth: z.number().min(0).max(100)
});

export async function understandComment(comment: NormalizedComment): Promise<CommentUnderstanding> {
  const client = getOpenAIClient();
  if (!client) {
    return heuristicUnderstanding(comment);
  }

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_ANALYSIS_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a market intelligence analyst. Extract strategic content signals from audience comments. Return only valid JSON matching the requested schema."
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: {
              intent: intentCategories,
              sentiment: ["negative", "neutral", "positive"],
              topic: "short human readable topic",
              canonicalTopic: "snake_case canonical topic",
              audienceType: audienceSegments,
              buyingStage: buyingStages,
              region: "country/region or null",
              desiredOutcome: "desired result or null",
              objection: "purchase/content objection or null",
              emotionalIntensity: "0-100",
              commercialIntent: "0-100",
              actionability: "0-100",
              insightDepth: "0-100"
            },
            comment
          })
        }
      ]
    });

    const content = response.choices[0]?.message.content ?? "{}";
    const parsed = understandingSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : heuristicUnderstanding(comment);
  } catch {
    return heuristicUnderstanding(comment);
  }
}

export function heuristicUnderstanding(comment: NormalizedComment): CommentUnderstanding {
  const text = comment.commentText.toLowerCase();
  const hasQuestion = /(\?|how|what|which|where|why|can i|should i)/i.test(text);
  const hasComplaint = /(hate|problem|broke|doesn't|does not|never|bad|irritat|oxidiz|cakey)/i.test(text);
  const hasComparison = /(vs|versus|better than|compare|dupe|alternative)/i.test(text);
  const hasPurchase = /(buy|price|worth it|order|cart|where can i get|recommend)/i.test(text);
  const hasTrend = /(viral|trending|everyone|tiktok made me|new trend)/i.test(text);

  const intent = hasPurchase
    ? "purchase_intent"
    : hasComplaint
      ? "complaint"
      : hasComparison
        ? "comparison"
        : hasTrend
          ? "trend_mention"
          : hasQuestion
            ? "question"
            : "recommendation";

  const audienceType = inferAudienceSegment(text);
  const buyingStage = hasPurchase ? "purchase" : hasComparison ? "consideration" : "awareness";
  const topic = inferTopic(comment);

  return {
    intent,
    sentiment: hasComplaint ? "negative" : hasPurchase ? "positive" : "neutral",
    topic,
    canonicalTopic: slugify(topic),
    audienceType,
    buyingStage,
    region: inferRegion(text),
    desiredOutcome: inferDesiredOutcome(text),
    objection: hasComplaint ? comment.commentText.slice(0, 240) : null,
    emotionalIntensity: /(!!!|hate|love|obsessed|desperate|terrible|amazing)/i.test(text) ? 82 : 42,
    commercialIntent: hasPurchase ? 86 : hasComparison ? 62 : 34,
    actionability: hasQuestion || hasPurchase || hasComplaint ? 78 : 45,
    insightDepth: comment.commentText.length > 140 ? 78 : 48
  };
}

function inferAudienceSegment(text: string): CommentUnderstanding["audienceType"] {
  if (/(beginner|new to|first time|starter)/i.test(text)) return "beginner";
  if (/(client|artist|kit|mua|professional)/i.test(text)) return "professional";
  if (/(wedding|bride|bridal)/i.test(text)) return "bridal_makeup";
  if (/(luxury|high end|designer|premium)/i.test(text)) return "luxury_buyer";
  if (/(cheap|budget|affordable|drugstore|dupe)/i.test(text)) return "budget_buyer";
  if (/(teen|school|prom|college)/i.test(text)) return "teen";
  if (/(mature|over 40|over 50|aging|fine lines)/i.test(text)) return "mature_audience";
  return "beginner";
}

function inferTopic(comment: NormalizedComment) {
  const text = `${comment.contentTitle} ${comment.commentText}`;
  const match = text.match(
    /(foundation|concealer|skincare|sunscreen|lipstick|makeup|shade match|oily skin|dry skin|hyperpigmentation|oxidation|lashes|routine)/i
  );

  return match?.[0] ?? comment.contentTitle.split(/\s+/).slice(0, 5).join(" ");
}

function inferRegion(text: string) {
  const regions = ["nigeria", "ghana", "kenya", "south africa", "uk", "london", "lagos", "accra", "nairobi"];
  return regions.find((region) => text.includes(region)) ?? null;
}

function inferDesiredOutcome(text: string) {
  const outcomes = ["last all day", "doesn't oxidize", "no flashback", "shade match", "clear skin", "glow"];
  return outcomes.find((outcome) => text.includes(outcome)) ?? null;
}
