"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Trend = {
  topic: string;
  current: number;
  growth: number;
  classification: string;
};

export function TrendRadar({ trends }: { trends: Trend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Radar</CardTitle>
        <CardDescription>Emerging, stable, declining, and exploding topics by mention velocity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="growth" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
