"use client";

import Link from "next/link";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { useLanguage } from "@/components/LanguageContext";

interface DashboardMetricsProps {
  totalCrops: number;
  hasFarms: boolean;
  soilMoistureValue: string;
  totalSoilReadings: number;
  unreadCount: number;
}

export default function DashboardMetrics({
  totalCrops,
  hasFarms,
  soilMoistureValue,
  totalSoilReadings,
  unreadCount,
}: DashboardMetricsProps) {
  const { t } = useLanguage();

  const badgeText = unreadCount === 0 ? "Normal" : unreadCount === 1 ? "1 Alert" : `${unreadCount} Alerts`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title={t("myCrops")}
        value={totalCrops.toString()}
        icon="🌿"
        description={totalCrops > 0 ? "Active registered plantings" : t("noCropsYet")}
        badge={totalCrops > 0 ? `${totalCrops} Active` : "No Crops"}
        accentColor="green"
      />
      <SummaryCard
        title={t("weather")}
        value={t("notAvailable")}
        icon="🌦"
        description={hasFarms ? "Forecast ready to connect" : t("connectFarmLocation")}
        badge={hasFarms ? "Farm Linked" : "Not Synced"}
        accentColor="blue"
      />
      <SummaryCard
        title={t("soilMoisture")}
        value={soilMoistureValue === "Not Available" ? t("notAvailable") : soilMoistureValue}
        icon="💧"
        description={totalSoilReadings > 0 ? "Latest logged moisture reading" : t("noReadingsRecorded")}
        badge={totalSoilReadings > 0 ? `${totalSoilReadings} Logs` : "No Readings"}
        accentColor="cyan"
      />
      <Link href="/dashboard/alerts" className="block cursor-pointer">
        <SummaryCard
          title={t("activeAlerts")}
          value={unreadCount.toString()}
          icon="⚠️"
          description={unreadCount > 0 ? "Unread warnings requiring review" : t("noCriticalIssues")}
          badge={badgeText}
          accentColor="amber"
        />
      </Link>
    </div>
  );
}
