"use client";

import { useState } from "react";
import Link from "next/link";
import { Ruler, Sparkles, ArrowLeft } from "lucide-react";

type CategoryType = "women" | "men" | "outerwear";

const SIZE_DATA = {
  women: [
    { size: "XS", ru: "40", bust: "80-84", waist: "60-64", hips: "88-92" },
    { size: "S", ru: "42", bust: "84-88", waist: "64-68", hips: "92-96" },
    { size: "M", ru: "44", bust: "88-92", waist: "68-72", hips: "96-100" },
    { size: "L", ru: "46", bust: "92-96", waist: "72-76", hips: "100-104" },
    { size: "XL", ru: "48", bust: "96-100", waist: "76-80", hips: "104-108" },
  ],
  men: [
    { size: "S", ru: "46", bust: "92-96", waist: "78-82", hips: "94-98" },
    { size: "M", ru: "48", bust: "96-100", waist: "82-86", hips: "98-102" },
    { size: "L", ru: "50", bust: "100-104", waist: "86-90", hips: "102-106" },
    { size: "XL", ru: "52", bust: "104-108", waist: "90-94", hips: "106-110" },
    { size: "2XL", ru: "54", bust: "108-112", waist: "94-98", hips: "110-114" },
    { size: "3XL", ru: "56", bust: "112-116", waist: "98-102", hips: "114-118" },
  ],
  outerwear: [
    { size: "S/M (Свободный крой)", ru: "46-48", bust: "92-100", waist: "78-86", hips: "94-102" },
    { size: "L/XL (Свободный крой)", ru: "50-52", bust: "100-108", waist: "86-94", hips: "102-110" },
    { size: "2XL/3XL (Свободный крой)", ru: "54-56", bust: "108-116", waist: "94-102", hips: "110-118" },
  ],
};

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("men");

  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* Header Banner */}
      <section className="bg-sabyr-black text-white pt-14 pb-16 border-b border-white/10">
        <div className="container max-w-4xl text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться в каталог
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-4 mx-auto block w-fit">
            <Ruler className="w-3.5 h-3.5" />
            Таблица размеров Atelier <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Гид по размерам и силуэту
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Каждое изделие SABYR кроится по выверенным авторским лекалам. Воспользуйтесь таблицей для безошибочного подбора идеальной посадки.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10">
        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-secondary p-1 rounded-full flex gap-1 border border-border">
            <button
              onClick={() => setActiveTab("women")}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === "women"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Женская коллекция
            </button>
            <button
              onClick={() => setActiveTab("men")}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === "men"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Мужская коллекция
            </button>
            <button
              onClick={() => setActiveTab("outerwear")}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === "outerwear"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Верхняя одежда & Оверсайз
            </button>
          </div>
        </div>

        {/* Size Table Card */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold">
                {activeTab === "women" && "Параметры женской линейки"}
                {activeTab === "men" && "Параметры мужской линейки"}
                {activeTab === "outerwear" && "Пальто, тренчи и свободный крой"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Все измерения приведены в сантиметрах (см)
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 bg-secondary rounded-full font-medium text-muted-foreground">
              Стандартная посадка
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Размер</th>
                  <th className="py-3.5 px-4 font-semibold">Размер RU</th>
                  <th className="py-3.5 px-4 font-semibold">Обхват груди (см)</th>
                  <th className="py-3.5 px-4 font-semibold">Обхват талии (см)</th>
                  <th className="py-3.5 px-4 font-semibold">Обхват бёдер (см)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SIZE_DATA[activeTab].map((row) => (
                  <tr key={row.size} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{row.size}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.ru}</td>
                    <td className="py-3 px-4 font-medium">{row.bust}</td>
                    <td className="py-3 px-4 font-medium">{row.waist}</td>
                    <td className="py-3 px-4 font-medium">{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground">
              1
            </div>
            <h3 className="font-semibold text-sm">Обхват груди</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Измеряется по наиболее выступающим точкам груди горизонтально вокруг туловища. Лента должна прилегать плотно, но без натяжения.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground">
              2
            </div>
            <h3 className="font-semibold text-sm">Обхват талии</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Измеряется вокруг самой узкой части туловища (выше пупка на 2-3 см). Во время замера держите осанку прямо и дышите спокойно.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground">
              3
            </div>
            <h3 className="font-semibold text-sm">Обхват бёдер</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Измеряется по наиболее выступающим точкам ягодиц, сомкнув стопы вместе. Лента располагается строго параллельно полу.
            </p>
          </div>
        </div>

        {/* AI Virtual Try-On Banner */}
        <div className="bg-gradient-to-r from-card via-secondary/50 to-card border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Сомневаетесь в размере?
            </div>
            <h3 className="font-bold text-lg">Воспользуйтесь AI Виртуальной Примеркой</h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Загрузите ваше фото, и нейросеть SABYR точно рассчитает посадку и пропорции изделия на вашей фигуре.
            </p>
          </div>

          <Link
            href="/ai-tryon"
            className="px-6 py-3 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
          >
            Перейти к примерке
          </Link>
        </div>
      </div>
    </main>
  );
}
