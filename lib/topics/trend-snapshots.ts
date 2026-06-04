import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateTrendSnapshot, type TrendSnapshotInput } from "@/lib/intelligence/trends";

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function previousMonthStart(date = new Date()) {
  const start = monthStart(date);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
}

async function countCommentsForTopicInRange(topicId: string, from: Date, to: Date) {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/** Persist monthly mention velocity for a canonical topic. */
export async function recordTrendSnapshot(userId: string, topicId: string) {
  const currentStart = monthStart();
  const previousStart = previousMonthStart();
  const nextMonth = monthStart(new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() + 1, 1)));

  const currentMentions = await countCommentsForTopicInRange(topicId, currentStart, nextMonth);
  const previousMentions = await countCommentsForTopicInRange(topicId, previousStart, currentStart);

  const threeMonthsAgo = new Date(Date.UTC(previousStart.getUTCFullYear(), previousStart.getUTCMonth() - 2, 1));
  const mentionsThreeMonthsAgo = await countCommentsForTopicInRange(topicId, threeMonthsAgo, previousStart);

  const { data: priorSnapshot } = await createSupabaseAdminClient()
    .from("trend_snapshots")
    .select("monthly_growth")
    .eq("topic_id", topicId)
    .eq("snapshot_month", previousStart.toISOString().slice(0, 10))
    .maybeSingle();

  const trend = calculateTrendSnapshot({
    currentMentions,
    previousMentions: Math.max(previousMentions, 1),
    mentionsThreeMonthsAgo: Math.max(mentionsThreeMonthsAgo, 1),
    previousVelocity: priorSnapshot ? Number(priorSnapshot.monthly_growth) : 0
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("trend_snapshots").upsert(
    {
      user_id: userId,
      topic_id: topicId,
      current_mentions: currentMentions,
      previous_mentions: previousMentions,
      monthly_growth: trend.monthlyGrowth,
      quarterly_growth: trend.quarterlyGrowth,
      acceleration: trend.acceleration,
      classification: trend.classification,
      snapshot_month: currentStart.toISOString().slice(0, 10)
    },
    { onConflict: "topic_id,snapshot_month" }
  );

  if (error) {
    throw error;
  }

  return trend;
}

/** Load real mention history for scoring (not synthetic 72% baseline). */
export async function getTrendInputForTopic(topicId: string): Promise<TrendSnapshotInput | null> {
  const currentStart = monthStart();
  const previousStart = previousMonthStart();
  const nextMonth = monthStart(new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() + 1, 1)));

  const currentMentions = await countCommentsForTopicInRange(topicId, currentStart, nextMonth);
  const previousMentions = await countCommentsForTopicInRange(topicId, previousStart, currentStart);

  if (currentMentions === 0 && previousMentions === 0) {
    const supabase = createSupabaseAdminClient();
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId);

    const allTime = count ?? 0;
    if (allTime === 0) {
      return null;
    }

    return {
      currentMentions: allTime,
      previousMentions: Math.max(1, Math.floor(allTime * 0.5))
    };
  }

  const threeMonthsAgo = new Date(Date.UTC(previousStart.getUTCFullYear(), previousStart.getUTCMonth() - 2, 1));
  const mentionsThreeMonthsAgo = await countCommentsForTopicInRange(topicId, threeMonthsAgo, previousStart);

  const { data: priorSnapshot } = await createSupabaseAdminClient()
    .from("trend_snapshots")
    .select("monthly_growth")
    .eq("topic_id", topicId)
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    currentMentions,
    previousMentions: Math.max(previousMentions, 1),
    mentionsThreeMonthsAgo: Math.max(mentionsThreeMonthsAgo, 1),
    previousVelocity: priorSnapshot ? Number(priorSnapshot.monthly_growth) : undefined
  };
}
