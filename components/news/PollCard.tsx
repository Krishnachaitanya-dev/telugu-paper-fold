import { Feather } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface PollOption {
  id: string;
  label: string;
  votes?: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes?: number;
  endsAt?: string;
}

interface Props {
  poll: PollData;
  compact?: boolean;
}

function PollCardBase({ poll, compact = false }: Props) {
  const [voted, setVoted] = useState<string | null>(null);
  // TODO: persist vote to backend when available

  const totalVotes = poll.totalVotes ?? poll.options.reduce((s, o) => s + (o.votes ?? 0), 0);

  function votePercent(option: PollOption): number {
    if (!voted || totalVotes === 0) return 0;
    return Math.round(((option.votes ?? 0) / totalVotes) * 100);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.pollBadge}>
          <Feather name="bar-chart-2" size={11} color="#0a9b9a" />
          <Text style={styles.pollBadgeText}>Today's Poll</Text>
        </View>
        {poll.endsAt ? (
          <Text style={styles.endLabel}>Ends today</Text>
        ) : null}
      </View>

      <Text style={[styles.question, compact && styles.questionCompact]} numberOfLines={compact ? 2 : undefined}>
        {poll.question}
      </Text>

      <View style={styles.options}>
        {poll.options.map((option) => {
          const isVoted = voted === option.id;
          const pct = votePercent(option);
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => !voted && setVoted(option.id)}
              activeOpacity={voted ? 1 : 0.78}
              style={[
                styles.option,
                isVoted && styles.optionVoted,
                voted && !isVoted && styles.optionDimmed,
              ]}
            >
              {voted ? (
                <View style={[styles.progressBar, { width: `${pct}%` as any }]} />
              ) : null}
              <Text style={[styles.optionText, isVoted && styles.optionTextVoted]}>
                {option.label}
              </Text>
              {voted ? (
                <Text style={styles.optionPct}>{pct}%</Text>
              ) : null}
              {isVoted ? <Feather name="check" size={14} color="#0a9b9a" style={styles.checkIcon} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.totalVotes}>
        {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
        {!voted ? " · Tap to vote" : ""}
      </Text>
    </View>
  );
}

export const PollCard = memo(PollCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161820",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(10,155,154,0.22)",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  pollBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,155,154,0.12)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pollBadgeText: { color: "#0a9b9a", fontSize: 11, fontWeight: "700" },
  endLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  question: { color: "#f0f2f6", fontSize: 15, fontWeight: "700", lineHeight: 21, marginBottom: 14 },
  questionCompact: { fontSize: 14 },
  options: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
    position: "relative",
  },
  optionVoted: {
    borderColor: "#0a9b9a",
    backgroundColor: "rgba(10,155,154,0.10)",
  },
  optionDimmed: { opacity: 0.65 },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,155,154,0.15)",
    borderRadius: 10,
  },
  optionText: { flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  optionTextVoted: { color: "#fff", fontWeight: "700" },
  optionPct: { color: "#0a9b9a", fontSize: 13, fontWeight: "800", marginLeft: 8 },
  checkIcon: { marginLeft: 4 },
  totalVotes: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 12 },
});
