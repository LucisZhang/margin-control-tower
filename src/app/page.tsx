"use client";

import MarginControlTower from "@/components/analytics/MarginControlTower";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { locale, setLocale } = useI18n();
  return (
    <main>
      <section className="workspace-head page-shell">
        <div><p className="eyebrow">Synthetic analytics engineering</p><h1>Margin Control Tower</h1><p className="lede">{locale === "en" ? "Trace contribution-margin drivers, test a disclosed scenario, and keep assumptions visible." : "追查贡献毛利驱动因素，测试公开说明的情景，并让每项假设保持可见。"}</p></div>
        <div className="identity-links" aria-label={locale === "en" ? "Language" : "语言"}><button type="button" onClick={() => setLocale("en")}>EN</button><button type="button" onClick={() => setLocale("zh")}>中文</button></div>
      </section>
      <section className="page-shell proof-section tinted-section"><MarginControlTower /></section>
    </main>
  );
}
