"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Trend = {
  topic: string;
  current: number;
  growth: number;
  classification: string;
};

export function TrendRadar({ trends }: { trends: Trend[] }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Radar</CardTitle>
        <CardDescription>Emerging, stable, declining, and exploding topics by mention velocity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="topic"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="growth" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
              Loading trend radar
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
